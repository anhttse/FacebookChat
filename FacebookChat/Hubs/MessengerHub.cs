using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;

namespace FacebookChat.Hubs
{
    public class MessengerHub : Hub
    {
        public void Hello()
        {
            Clients.All.hello();
        }

        public void SendMessage(object msg)
        {
            Clients.All.addNewMessageToPage(msg);
        }
    }
}