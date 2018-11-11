using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using FacebookChat.Hubs;
using MessengerBot.Models;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;

namespace FacebookChat.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public ActionResult Receive()
        {
            var query = Request.QueryString;
            if (query["hub.mode"] == "subscribe" &&
                query["hub.verify_token"] == "myToken874523")
            {
                //string type = Request.QueryString["type"];
                var retVal = query["hub.challenge"];
                return Json(int.Parse(retVal), JsonRequestBehavior.AllowGet);
            }
            else
            {
                return HttpNotFound();
            }
        }
        [HttpPost]
        public ActionResult Receive(WebhookModel data)
        {
            System.IO.File.AppendAllText(Server.MapPath("~/Content/webhook.txt"),JsonConvert.SerializeObject(data));
            var hub = GlobalHost.ConnectionManager.GetHubContext<MessengerHub>();
            hub.Clients.All.addNewMessageToPage(data);
            return new HttpStatusCodeResult(HttpStatusCode.OK);
        }
        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}