// Sets options to be global
var options = {
    filter: '', 
    blur: '',
    sort: '',
    frequency: {}
};

// Getting the options and then setting the local values
chrome.storage.sync.get(["options"], function(result) {
    options.filter = result.options.filter;
    options.blur = result.options.blur;
    options.sort = result.options.sort;
    options.frequency = result.options.frequency;

    // All DOM elements to be edited in popup.html
    var selectFilter = document.getElementById('filter');
    var range = document.getElementById('blur');
    var selectSort = document.getElementById('sort');
    var type = document.getElementById('type');
    var amount = document.getElementById('amount');
    
    // Sets min/max for fequency based on the type of Days/Hours/Minutes
    switch (options.frequency.type){
        case "Day":
            type.selectedIndex = 2;
            amount.min = 0;
            amount.max = 8;
            break;

        case "Hour":
            type.selectedIndex = 1;
            amount.min = 0;
            amount.max = 24;
            break;
        
        case "Minute":
            type.selectedIndex = 0;
            amount.min = 0;
            amount.max = 60;
            break;

        default:
            type.selectedIndex = 2;
            break;

    }

    // Setting the default DOM element value based on the option corresponding to it
    for(var i, j = 0; i = selectSort.options[j]; j++) {
        if(i.value == options.sort) {
            selectSort.selectedIndex = j;
            break;
        }
    }
    for(var i, j = 0; i = selectFilter.options[j]; j++) {
        if(i.value == options.filter) {
            selectFilter.selectedIndex = j;
            break;
        }
    }
    range.value = options.blur;
    document.getElementById('text').value = range.value; 
    amount.value = options.frequency.amount;


    // Adds all of the event listeners to change DOM and set settings whenever values are changed
    range.addEventListener('change', (event) => {
        document.getElementById('text').value = range.value;
        settings("blur", event.target.value);
    });
    selectFilter.addEventListener('change', (event) => {
        settings("filter", event.target.value);
    });
    selectSort.addEventListener('change', (event) => {
        settings("sort", event.target.value);
    });
    type.addEventListener('change', (event) => {
        var am = amount.value;
        switch (event.target.value){
            case "Hour":
                if (amount.value > 23){
                    am = 23;
                }
                break;

            case "Day":
                if (amount.value > 7){
                    am = 7;
                }
                break;
            
            default:
                break;
        }
        settings("frequency.type", event.target.value, am);
    });
    amount.addEventListener('change', (event) => {
        if(event.target.value >  amount.max-1){
            event.target.value = 1;
        } else if(event.target.value <  amount.min+1) {
            event.target.value = amount.max - 1
        } 
        settings("frequency.amount", event.target.value);
 
    });
});

// Sets the settings for the extension based on the value thats user inputed.
// Then creates a new alarm for it that activates now. 
// If an alarm is created with the same name as a previous alarm, the previous alarm is overwritten
function settings(key, value, am){
    // Setting the period to activate based on type of Days/Hours/Minutes
    if (key.includes("frequency")){
        if(key == "frequency.type"){
            amount.value = am;
            options["frequency"] = {
                type: value,
                amount: am
            };
        } else if (key == "frequency.amount"){
            options["frequency"] = {
                type: options.frequency.type,
                amount: value
            }
        }

        // Need to update the min/max values for popup.html
        switch (options.frequency.type){
            case "Day":
                amount.min = 0;
                amount.max = 8;
                break;
    
            case "Hour":
                amount.min = 0;
                amount.max = 24;
                break;
            
            case "Minute":
                amount.min = 0;
                amount.max = 60;
                break;
    
            default:
                break;    
        }    
        
    } else {
        options[key] = value;
    }
    // Storing the settings in storage to be fecthed by other parts of extension
    chrome.storage.sync.set({options: options}).then(function(){
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
        //Creates alarm for now
        chrome.alarms.create(
            'main',
            {when: Date.now(), periodInMinutes: Number(period)},
            );
    });
}
