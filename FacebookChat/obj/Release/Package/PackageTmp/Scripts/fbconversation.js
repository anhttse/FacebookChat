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
var _pageId = "341754012625518";
var _pageToken;
$(document).on("fbload",
    function () {

        FB.getLoginStatus(function (response) {
            if (response.status !== "connected") {
                //show login modal
                _loginFacebook.call();
            } else {
                _getProfile.call();
                _loadConversation.call();
            }
        });

        $("#contacts").on("click", "li.contact:not(.active)",
            e => {
                e.stopImmediatePropagation();
                e.preventDefault();
                const el = $(e.currentTarget);
                $("div#contacts li").removeClass("active");
                el.addClass("active");
                const conversationId = el.data("conversationid");
                const avatar = el.find("img").prop("src");
                const name = el.find("p.name").text();
                updateCustomerProfile({ img: avatar, name: name });
                _loadConversationContent(conversationId);
            });
    });


_getPageToken = () => {
    return new Promise((resolve, reject) => {
        FB.api("me/accounts",
            "GET",
            {},
            response => {
                const page = jQuery.map(response.data,
                    data => {
                        if (data.id === _pageId) {
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
        const rs = await _getPageToken();
        _pageToken = rs.access_token;
    }
    FB.api("me/conversations?fields=message_count,unread_count,updated_time,messages.limit(1){message,attachments,from},senders",
        "GET",
        { access_token: _pageToken },
        response => {
            updateContact(response.data);
        });
}

_loadConversationContent = async convsersationId => {
    FB.api(`${convsersationId}?fields=can_reply,messages.limit(10){message,created_time,from,attachments{name,file_url}}`,
        { access_token: _pageToken },
        response => {
            const canRep = response.can_reply;
            const msgs = response.messages.data;
            msgs.forEach(msg => {
                addChatMessage(msg);
            });
            $("#content-loading").hide();
            $(".messages").animate({ scrollTop: $(document).height() }, "fast");
        });
};

//call back functions
loginModal = () => {
    $("#fblogin-modal").modal("show");
};

updateProfile = rp => {
    $("#profile-img").prop("src", rp.picture.data.url);
    $("#profile-name").text(rp.name);
}
updateCustomerProfile = data => {
    $("#contact-profile img").prop("src", data.img);
    $("#contact-profile p").text(data.name);
}
updateContact = (arr) => {
    arr.forEach(contact => {
        const sender = contact.senders.data[0];
        const lastMsg = contact.messages.data[0];
        const msg = lastMsg.from.id === _pageId ? `Bạn: ${lastMsg.message}` : lastMsg.message;
        const item = $(`<li class="contact" data-conversationid="${contact.id}">
                        <div class="wrap">
                            <span class="contact-status online"></span>
                            <img src="${getPicture(sender.id)}" alt="" />
                            <div}}} class="meta">
                                <p class="name">${sender.name}</p>
                                <p class="preview">${msg}</p>
                            </div>
                        </div>
                    </li>`);
        $("#contacts ul").append(item);

    });
    $("#conversation-loading").hide();
    $("#contacts li.contact:eq(0)").click();
}

addChatMessage = (msg) => {
    const uId = msg.from.id;
    const isSender = uId === _pageId;
    const cls = isSender ? "sent" : "replies";
    const hasAttachments = msg.attachments ? true : false;
    const content = hasAttachments ? `<a href="${msg.attachments.data[0].file_url}">${msg.attachments.data[0].name}</a>` : msg.message;
    const message = $(`<li class="${cls}">
                        <img src="${getPicture(uId)}" alt="" />
                        <p>${content}</p>
                    </li>`);
    $("#content-box ul").prepend(message);
}

getPicture = uId => {
    return `https://graph.facebook.com/v3.2/${uId}/picture?access_token=${_pageToken}`;
}


newMessage = () => {
    const conversationId = $("#contacts li.contact.active").data("conversationid");
    const msg = $(".message-input input").val();
    if ($.trim(msg) === '') {
        return false;
    }
    FB.api(`${conversationId}/messages`, "POST", { message: msg, access_token: _pageToken }, response => {
        if (response.id) {
            $(`<li class="sent"><img src="${getPicture(_pageId)}" alt="" /><p>${msg}</p></li>`).appendTo($('.messages ul'));
            $('.message-input input').val(null);
            $('.contact.active .preview').html('<span>Bạn: </span>' + msg);
            $(".messages").animate({ scrollTop: $(document).height() }, "fast");
        }
    });
};

/* event binding (main) */
$('.submit').click(function () {
    newMessage();
});

$(window).on('keydown', function (e) {
    if (e.which == 13) {
        newMessage();
        return false;
    }
});

/* event binding - end */

/*extension functions*/


$("#profile-img").click(function () {
    $("#status-options").toggleClass("active");
});

$(".expand-button").click(function () {
    $("#profile").toggleClass("expanded");
    $("#contacts").toggleClass("expanded");
});

$("#status-options ul li").click(function () {
    $("#profile-img").removeClass();
    $("#status-online").removeClass("active");
    $("#status-away").removeClass("active");
    $("#status-busy").removeClass("active");
    $("#status-offline").removeClass("active");
    $(this).addClass("active");

    if ($("#status-online").hasClass("active")) {
        $("#profile-img").addClass("online");
    } else if ($("#status-away").hasClass("active")) {
        $("#profile-img").addClass("away");
    } else if ($("#status-busy").hasClass("active")) {
        $("#profile-img").addClass("busy");
    } else if ($("#status-offline").hasClass("active")) {
        $("#profile-img").addClass("offline");
    } else {
        $("#profile-img").removeClass();
    };

    $("#status-options").removeClass("active");
});
/*extension functions - end*/

var chat = $.connection.messengerHub;
chat.client.addNewMessageToPage = function (message) {
    console.log(message);
};

$.connection.hub.start().done(function () {

});