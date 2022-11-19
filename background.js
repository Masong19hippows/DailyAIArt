var globalTab;
var tabDelete;

var options = {
  filter: '', 
  blur: '',
  sort: '',
  frequency: {}
};

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === "main") {
    entry();
  }
});
async function getTab() {

  return new Promise((resolve, reject) => {
    chrome.tabs.query({}).then((tabs) => {
      if(tabs.length == 0){
        chrome.windows.create({state: 'maximized',url: 'https://google.com'}).then((window) => {
          chrome.windows.update(window.id, {state: 'minimized'});
          resolve({tab: window.tabs[0], discard: true, window: window.id});
          return;
        });
      } else {
        if (tabs.length == 1) {
          if (tabs[0].url == ''){
            chrome.tabs.create({'active': false, 'url': 'https://google.com'}).then((newTab) => {
              resolve({tab: newTab, discard: true, window: ''});
            });
          }
          var url = new URL(tabs[0].url);
          if (url.protocol !== 'http:' && url.protocol !== 'https:'){
            chrome.tabs.create({'active': false, 'url': 'https://google.com'}).then((newTab) => {
              resolve({tab: newTab, discard: true, window: ''});
            });
          } else {
            resolve({tab: tabs[0], discard: false, window: ''});
          }
        } else {
          for (i in tabs){
            if (tabs[i].url == ''){
              if (i == tabs.length-1){
                chrome.tabs.create({'active': false, 'url': 'https://google.com'}).then((newTab) => {
                  resolve({tab: newTab, discard: true, window: ''});
                });
                break;
              } else {
                continue;
              }
            }
            var url = new URL(tabs[i].url);
            if (url.protocol !== 'http:' && url.protocol !== 'https:'){
              if (i == tabs.length-1){
                chrome.tabs.create({'active': false, 'url': 'https://google.com'}).then((newTab) => {
                  resolve({tab: newTab, discard: true, window: ''});
                });
              }
              continue;
            } else {
              resolve({tab: tabs[i], discard: false, window: ''});
              break;
            }
          }       
        }     
      }
    });
    
  });
}
function callback() {
  if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message);
  }
}
function entry(){
 
  getTab().then((tab) =>{
    globalTab = tab;
    chrome.scripting.executeScript({
      target: { tabId: tab.tab.id },
      files: ["inject.js"]
    }, function() {
      tabDelete = globalTab.discard;
    });
 });  
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.pic == ''){
    fetch(request.link).then((r) => {
      r.text().then((re) => {
        var pos = re.indexOf("og:image") + 19;
        var posEnd = re.indexOf('"/><meta property="og:image:alt"') -1;
        var final = re.substring(pos, posEnd);
        sendResponse({link: final});
      });  
    }); 
  } else {
      if (tabDelete){
        if (globalTab.window == ''){
          chrome.tabs.remove(globalTab.tab.id);
        } else {
          chrome.windows.remove(globalTab.window);
        }
      }
      var newArray = JSON.parse(request.pic);
      var arrayBuffer = new Uint8Array(newArray.file).buffer;
      chrome.wallpaper.setWallpaper(
        {
          'data': arrayBuffer,
          'layout': "CENTER_CROPPED",
          'filename': 'wallpaper.png'
        },
        callback
      );
}
  return true;
});

chrome.runtime.onInstalled.addListener(function (object) {
  options.blur = '15';
  options.filter = 'None';
  options.frequency = {amount: 1, type: 'Day'};
  options.sort = 'Top: Last Hour';
  chrome.storage.sync.set({options: options}).then(function() {
  chrome.storage.sync.get(["options"], function(result) {
    options.filter = result.options.filter;
    options.blur = result.options.blur;
    options.sort = result.options.sort;
    options.frequency = result.options.frequency;

    var period = 0;
    switch(options.frequency.type){
      case "Day":
          period = 24*60*options.frequency.amount;
          break;

      case "Hour":
          period = 60*options.frequency.amount;
          break;

      case "Minute":
          period = options.frequency.amount;
          break;
  }

  chrome.alarms.create(
      'main',
      {when: Date.now(), periodInMinutes: period},
    );
  });
  });
});
