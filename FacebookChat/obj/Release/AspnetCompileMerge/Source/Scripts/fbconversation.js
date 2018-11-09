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
        _pageToken = await _getPageToken;
        console.log(_pageToken);
    }
    FB.api("me/conversations?fields=unread_count,updated_time,message_count,senders",
        "GET",
        { access_token: _pageToken },
        response => {
//            conso
        });
}
updateProfile = rp => {
    $("#profile-img").prop("src", rp.picture.data.url);
    $("#profile-name").text(rp.name);
}

_getPageToken = async  pageId => {
    const promise = new Promise((resolve, reject) => {
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

    return await promise;
}