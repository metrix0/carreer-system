using System;
using System.IO;
using System.Net;
using System.Diagnostics;
using System.Threading;
using System.Collections;
using System.Collections.Generic;
using System.Web.Script.Serialization;
using System.Windows.Forms;

class SharedBrowser {
#if QA
 static string root = Path.Combine(Path.GetTempPath(), "CareerBrowserLauncher-QA");
 const int port = 19322;
 const string mode = "--headless=new ";
#else
 static string root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "AI-Browser");
 const int port = 9222;
 const string mode = "";
#endif
 static JavaScriptSerializer json = new JavaScriptSerializer();
 static string Request(string path, string method = "GET") {
  var req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:"+port + path);
  req.Proxy = null; req.Method = method; req.Timeout = 1500;
  using (var res = req.GetResponse()) using (var reader = new StreamReader(res.GetResponseStream())) return reader.ReadToEnd();
 }
 static bool Ready() { try { Request("/json/version"); return true; } catch { return false; } }
 [STAThread] static int Main(string[] args) {
  try {
   if (args.Length != 1 || !args[0].StartsWith("career-browser:open?url=", StringComparison.Ordinal)) throw new Exception("Invalid Career Radar link.");
   var payload = args[0].Substring("career-browser:open?url=".Length).Split(new string[]{"&task="}, StringSplitOptions.None);
   if(payload.Length > 2) throw new Exception("Invalid link.");
   string task = null;
   Guid taskId;
   if(payload.Length == 2) { if(!Guid.TryParse(payload[1],out taskId)) throw new Exception("Invalid task."); task=taskId.ToString(); }
   var raw = Uri.UnescapeDataString(payload[0]);
   Uri target;
   if (raw.Length > 16000 || !Uri.TryCreate(raw, UriKind.Absolute, out target) || target.Scheme != "https" || !String.IsNullOrEmpty(target.UserInfo) || raw.IndexOfAny(new char[]{'\r','\n','\0'}) >= 0) throw new Exception("Only HTTPS recruitment links are supported.");
   Directory.CreateDirectory(root);
   if (!Ready()) {
    string edge = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe");
    if (!File.Exists(edge)) throw new Exception("Microsoft Edge was not found.");
    Process.Start(new ProcessStartInfo(edge, mode+"--remote-debugging-address=127.0.0.1 --remote-debugging-port="+port+" --user-data-dir=\""+Path.Combine(root,"UserData")+"\" about:blank") { UseShellExecute=false });
    for(int i=0;i<80 && !Ready();i++) Thread.Sleep(100);
    if(!Ready()) throw new Exception("The shared Edge session is unavailable. If it is already open without debugging, close it normally and try again.");
   }
   // Human handoff takes priority. Agents must leave this tab untouched.
   var marker = Path.Combine(root,"human-handoff.json");
   string id = null;
   string savedTab = null;
   var mapping = task == null ? null : Path.Combine(root,"task-"+task+".tab");
   if(mapping != null && File.Exists(mapping)) savedTab=File.ReadAllText(mapping);
   var tabs = json.Deserialize<ArrayList>(Request("/json/list"));
   foreach(Dictionary<string,object> tab in tabs) {
    if(tab.ContainsKey("type") && (string)tab["type"] == "page" && tab.ContainsKey("url") && ((string)tab["id"] == savedTab || (string)tab["url"] == target.AbsoluteUri)) { id=(string)tab["id"]; break; }
   }
   File.WriteAllText(marker,json.Serialize(new { owner="Candidate", started_at=DateTime.UtcNow.ToString("o"), tab_id=id, instruction="Human session: do not navigate, reload or automate this tab. Resume only after candidate handoff." }));
   if(id == null) {
    var tab = json.Deserialize<Dictionary<string,object>>(Request("/json/new?"+Uri.EscapeDataString(target.AbsoluteUri),"PUT"));
    id=(string)tab["id"];
    File.WriteAllText(marker,json.Serialize(new { owner="Candidate", started_at=DateTime.UtcNow.ToString("o"), tab_id=id, instruction="Human session: do not navigate, reload or automate this tab. Resume only after candidate handoff." }));
   }
   if(mapping != null) File.WriteAllText(mapping,id);
   Request("/json/activate/"+Uri.EscapeDataString(id));
   return 0;
  } catch(Exception e) {
#if QA
   Console.Error.WriteLine(e.GetType().Name+": "+e.Message); return 1;
#else
   MessageBox.Show("Could not open the shared browser. Check that Microsoft Edge is installed and the shared session is available.", "Career Radar", MessageBoxButtons.OK, MessageBoxIcon.Warning); return 1;
#endif
  }
 }
}
