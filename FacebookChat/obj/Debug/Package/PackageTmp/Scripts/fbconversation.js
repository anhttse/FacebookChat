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
    alertify.alert()
        .setting({
            'label': 'Đăng nhập',
            'message': 'Bạn cần đăng nhập vào facebook để sử dụng chức năng này',
            'onok': function () {
                FB.login(function (response) {
                    console.log(response);
                }, { scope: 'public_profile,email,manage_pages,read_page_mailboxes' });
            }
        }).show();
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
    var data = await new Promise((resolve, reject) => {
        FB.api(
            `${convsersationId
            }?fields=can_reply,messages.limit(10){message,created_time,from,attachments{name,file_url,image_data,mime_type,video_data}}`,
            { access_token: _pageToken },
            response => {
                resolve(response);
            });
    });
    console.log(data);
    const canRep = data.can_reply;
    const msgs = data.messages.data;
    for(let msg of msgs) {
        await loadChatMessage(msg);
    }
    $("#content-loading").hide();
    $(".messages").animate({ scrollTop: $(document).height() }, "fast");
    
};
_sendAttachFile = () => {
    const recipient = $("#contacts").find(`li.contact.active`).data("userid");
    var file = $("#attachFile")[0].files[0];

    if (!recipient || !type) return;
    const type = file.type.split("/")[0];
    const form = new FormData();
    form.append("recipient", `{ "id" : "${recipient}"}`);
    form.append("message", `{"attachment":{"type":"${type}", "payload":{"is_reusable":true}}}`);
    form.append("filedata", file);
    $.ajax({
        url: `https://graph.facebook.com/v2.6/me/messages?access_token=${_pageToken}`,
        method: "post",
        data: form,
        contentType: false,
        processData: false,
        success: response => {
            console.log(response);
        },
        error: (xhr, textStatus, errorThrown) => {
            //            console.log(xhr);
        }
    });
}
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
        const item = $(`<li class="contact" data-userid="${sender.id}" data-conversationid="${contact.id}">
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

loadChatMessage = async (msg) => {
    console.log(msg);
    const uId = msg.from.id;
    const isSender = uId === _pageId;
    const cls = isSender ? "sent" : "replies";
    //    const mimeType = msg = msg.attachments.data[0].mime_type;
    const content = await getContent(msg);
    const message = $(`<li class="${cls}">
                        <img class="avatar" src="${getPicture(uId)}" alt="" />
                        ${content}
                    </li>`);
    $("#content-box ul").prepend(message);
}

getContent = async (msg) => {
    var attachments = msg.attachments;
    console.log(attachments);
    var type = "message";
    if (attachments) {
        type = attachments.data[0].mime_type.split("/")[0] === "image" ? "image" : "file";
    }
    if (type === "image") {
        const imageData = attachments.data[0].image_data;
        if (imageData) return getChatMessage(type, imageData);
        const url = attachments.data[0].file_url;
        const img = await getMeta(url);
        return getChatMessage(type, { width: img.width, height: img.height, previewUrl: url, imgUrl: url });
    }
    if (type === "file") {
        const attach = attachments.data[0];
        return getChatMessage(type, attach);
    }
    if (type === "message") {
        return getChatMessage(type, msg);
    }
    return "";
}
getMeta = async (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}
getChatMessage = (type, msg) => {
    switch (type) {
        case "message":
            return `<p>${msg.message}</p>`;
        case "image":
            {
                const width = msg.width;
                const height = msg.height;
                const previewUrl = msg.preview_url;
                const imgUrl = msg.url;
                return `<div class='img-attach' data-url='${imgUrl}' style='${getImgSize(width, height)};border-radius: 20px; background-image: url("${previewUrl}"); background-position: center center;display:inline-block'>
                        </div>`;
                //        return `<img style="border-radius:20px;" src="${attachments.data[0].file_url}/>"`;
            }
        case "file":
            return `<p><a href="${msg.file_url}">${msg.name}</a></p>`;
        default:
    }
    return "";
}
getImgSize = (width, height) => {
    const imgMaxWidth = 300;
    if (width <= imgMaxWidth)
        return `width:${width}px;height:${height}px`;
    const ratio = width / height;
    return `width:${imgMaxWidth}px;height:${Math.round(imgMaxWidth / ratio)}px`;
}
newMessageReceive = async (msg) => {
    const sender = msg.sender.id;
    const hasAttach = msg.message.attachments ? true : false;
    let type = "message";
    if (hasAttach) {
        type = msg.message.attachments[0].payload.type;
    }
    let content = "";
    if (type === "message") {
        getChatMessage(type, {message:msg.text});
    }
    if (type === "image") {
        const url = msg.attachments[0].payload.url;
        const img = await getMeta(url);
        getChatMessage(type, { width: img.width, height: img.height, previewUrl: url, imgUrl: url });
    }
    const isChatting = $("#contacts").find(`li.contact.active[data-userid="${sender}"]`).length > 0;
    $(`#contacts li.contact[data-userid="${sender}"]`).find("p.preview").text(message.message.text);
    if (isChatting) {
        const isSender = sender === _pageId;
        const cls = isSender ? "sent" : "replies";

        const message = $(`<li class="${cls}">
                        <img src="${getPicture(sender)}" alt="" />
                        ${content}
                    </li>`);
        $("#content-box ul").append(message);
        $(".messages").animate({ scrollTop: $(".messages").height() }, "fast");
    }
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

/*SignalR */
var chat = $.connection.messengerHub;
chat.client.addNewMessageToPage = function (data) {
    const entry = data.entry[0];
    const message = entry.messaging[0];
    newMessageReceive(message);
};

$.connection.hub.start().done(function () {

});