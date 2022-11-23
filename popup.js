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
    var apply = document.getElementById('apply');
    
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
    apply.addEventListener('click', function() {
        apply.innerHTML = 'Applied';
        setTimeout(function(){
            apply.innerHTML = 'Make a Change';
        }, 1000);
        options['blur'] = range.value;
        options["filter"] = selectFilter.value;
        options["sort"] = selectSort.value;
        options["frequency"] = {
            type: type.value,
            amount: amount.value
        };
        // Sets the settings in Storage to be fetched by others
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
        
    });

    // Updates the value of the blur output
    range.addEventListener('change', () => {
        document.getElementById('text').value = range.value;
        apply.innerHTML = 'Apply Changes';
    });

    // Updates the update button on change
    selectFilter.addEventListener('change', () => {
        console.log("is this working");
        apply.innerHTML = 'Apply Changes';
    });
    selectSort.addEventListener('change', () => {
        apply.innerHTML = 'Apply Changes';
        console.log("is this working");

    });

    // Updates the value of amount by whatever type is
    type.addEventListener('change', (event) => {
        switch (event.target.value){
            case "Hour":
                if (amount.value > 23){
                    amount.value = 23;
                }
                amount.min = 0;
                amount.max = 24;
                break;

            case "Day":
                if (amount.value > 7){
                    amount.value = 7;
                }
                amount.min = 0;
                amount.max = 8;
                break;

            case "Minute":
                amount.min = 0;
                amount.max = 60;
                break;    
            
            default:
                break;
        }
        apply.innerHTML = 'Apply Changes';
    });
    // Makes the max/min values wrap around
    amount.addEventListener('change', (event) => {
        if(event.target.value >  amount.max-1){
            event.target.value = 1;
        } else if(event.target.value <  amount.min+1) {
            event.target.value = amount.max - 1
        } 
        apply.innerHTML = 'Apply Changes'; 
    });
});
