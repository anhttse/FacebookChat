window.fbAsyncInit = function () {
    FB.init({
        appId: '756350858047307',
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v3.2'
    });
    $(document).trigger("fbload");
};

(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) { return; }
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

var _pageToken;
$(document).on("fbload",
    function () {
        
        FB.getLoginStatus(function (response) {
            if (response.status !== "connected") {
                _loginFacebook.call();
            } else {
                _getProfile.call();
                _loadConversation.call();
            }
        });


    });

_loginModal = () => {
    $("#fblogin-modal").modal("show");
};

_loginFacebook = () => {
    FB.login(function (response) {
        console.log(response);
    }, { scope: 'public_profile,email,manage_pages,read_page_mailboxes' });
}

_getProfile = () => {
    FB.api(
        '/me?fields=picture{url},name',
        'GET',
        {},
        function (response) {
            console.log(response);
            updateProfile(response);
        }
    );
}

_loadConversation = async () => {
    if (!_pageToken) {
        const rs = await _getPageToken("341754012625518");
        _pageToken = rs.access_token;
    }
    FB.api("me/conversations?fields=message_count,unread_count,updated_time,messages.limit(1){message,attachments},senders",
        "GET",
        { access_token: _pageToken },
        response => {
            console.log(response);
            updateContact(response.data);
        });
}
_getPageToken = pageId => {
    return new Promise((resolve, reject) => {
        FB.api("me/accounts",
            "GET",
            {},
            response => {
                const page = jQuery.map(response.data,
                    data => {
                        if (data.id === pageId) {
                            return data;
                        }
                        return null;
                    });
                if (page) {
                    resolve(page[0]);
                } else {
                    reject(page);
                }
            });
    });
}

//call back functions
updateProfile = rp => {
    $("#profile-img").prop("src", rp.picture.data.url);
    $("#profile-name").text(rp.name);
}

updateContact = (arr) => {
    console.log(arr);
    arr.forEach(contact => {
        const sender = contact.senders.data[0];
        const lastMsg = contact.messages.data[0].message;
        console.log(contact.id);
        console.log(lastMsg);
        console.log(sender.name);
        const item = $(`<li class="contact" data-conversationid="${contact.id}">
                        <div class="wrap">
                            <span class="contact-status online"></span>
                            <img src="" alt="" />
                            <div class="meta">
                                <p class="name">${sender.name}</p>
                                <p class="preview">${lastMsg}</p>
                            </div>
                        </div>
                    </li>`);
        $("#contacts ul").append(item);
    });
}
