// Sets the options to be global
var options = {
  filter: '', 
  blur: '',
  sort: '',
  frequency: {}
};

// Gets the options and sets them locally, then initiates the main injection
chrome.storage.sync.get(["options"], function(result) {
  options.filter = result.options.filter;
  options.blur = result.options.blur;
  options.sort = result.options.sort;
  options.frequency = result.options.frequency;
  injection();
});


// Gets the image, comverts it into 16:9 format, and then fills the remaining/background pixels
//to a blurred version of the image
async function fillBlur(link) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var blob;
  
    // Creating image DOM object. This cannot be done inside of a content script.
    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = link;
    img.onload = function(){
  
      var dx = 0;
      var dy = 0;
      var calculatedHeight = Math.round((img.width / 16) * 9);
      var calculatedWidth = Math.round((img.height / 9) * 16);
  
      //Need to pad above and below
      if (calculatedHeight > img.height) {
          dy = Math.round((calculatedHeight - img.height) / 2);
          canvas.width = img.width;
          canvas.height = calculatedHeight;
      } else {
          dx = Math.round((calculatedWidth - img.width) / 2);
          canvas.width = calculatedWidth;
          canvas.height = img.height;
      }
  
  
      ctx.filter = 'blur(' + options.blur + 'px)';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      ctx.filter = 'none';
      ctx.drawImage(img, dx, dy, img.width, img.height);
      blob = dataURItoBlob(canvas.toDataURL("image/png"));
    }
  
    return new Promise((resolve, reject) => {
      setTimeout(function(){
        blob.arrayBuffer().then((value) => {
          resolve(value);
        });
      }, 5000);
    });
  }
  
// Converts the local image into a blob object
function dataURItoBlob(dataURI) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);

  // create a view into the buffer
  var ia = new Uint8Array(ab);

  // set the bytes of the buffer to the correct values
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  var blob = new Blob([ab], {type: mimeString});
  return blob;

}
  
// Sends the link to be fetched by content scipt. Cannot do inside of injection because of CORS.
async function getArtLink(link){
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({link: link, pic: ''}).then((response) => {
      resolve(response.link);
    });
  }); 
  }


// Entry point for the injection
function injection(){
  // Creates the link to be fetched using the user defined options
  var link = 'https://creator.nightcafe.studio/explore?';
  switch (options.filter){
    case "None":
      link = link + '&q=';
      break;

    case "Text To Image":
      link = link + "filter=text&q=";
      break;

    case "Artistic":
      link = link + "filter=artistic&q=";
      break;

    case "Coherent":
      link = link + "filter=Coherent&q=";
      break;

    case "Stable":
      link = link + "filter=stable&q=";
      break;

    case "DALL-E 2":
      link = link + "filter=dalle2&q=";
      break;

    case "Style Transfer":
      link = link + "filter=nst&q=";
      break;

    default:
      link = link + '&q=';
      break;
  }

  switch (options.sort){
    case "None":
      break;

    case "Newest Creations":
      link = link + "new";
      break;

    case "Top: Last Hour":
      break;

    case "Top: Last Day":
      link = link + "top-day";
      break;

    case "Top: Last Week":
      link = link + "top-week";
      break;

    case "Top: Last Month":
      link = link + "top-month";
      break;

    case "Top: All Time":
      link = link + "top-all";
      break;

    default:
      break;
  }

  // Gets the image from link, proccess' it in injection, then sends the result to content script.
  getArtLink(link).then((newlink) => {
      fillBlur(newlink).then((data) => {
      var newArray = Array.from(new Uint8Array(data));
      var data = {file: newArray}
      var string = JSON.stringify(data)
      chrome.runtime.sendMessage({pic: string});
      });
    });
}
