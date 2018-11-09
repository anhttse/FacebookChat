$(document).on("fbload",
    function () {
        var _pageToken = "";
        FB.getLoginStatus(function (response) {
            if (response.status !== "connected") {
                _loginFacebook.call();
            } else {
                _getProfile.call();
                _pageToken = await _getPageToken("341754012625518");
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

_loadConversation = () => {
    FB.api("me/conversations?fields=unread_count,updated_time,message_count,senders",
        "GET",
        {access_token:_pageToken},
        response => {
            conso
        });
}
updateProfile = rp => {
    $("#profile-img").prop("src", rp.picture.data.url);
    $("#profile-name").text(rp.name);
}

_getPageToken = pageId => {
    FB.api("me/accounts",
        "GET",
        {},
        response => {
            return new Promise(resolve => {
                const page = Jquery.map(response.data,
                    data => {
                        if (data.id === pageId) {
                            return data;
                        }
                    });
                resolve(page);
            });
        });
}