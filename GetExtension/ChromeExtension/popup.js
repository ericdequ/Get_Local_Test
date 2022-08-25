let current_page = null; //null when no search performed
let total_pages = null; //null when no search performed
let currentItems = []; //Empty Object 
let current_search = null;
let current_item = null;
const previous_page = null;
const external_search = true;
//Watch this gameplay
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.recipient === "popup-script") {
        fetchAcronymApi(request.search_term)
            .then((acronymObj) => {
                currentItems = acronymObj;;
                total_pages = 1;
                current_page = 1;
                constructPage(current_page, total_pages, currentItems, false);
                sendResponse({ completed: true })
            })
    }
})

const fetchAcronymApi = async (search_term) => {
    alldata = []
    deform = []
    GETBASE = []
    DEFBASE = []

    const searchstring = 'http://acronyms.silmaril.ie/cgi-bin/xaa?' + encodeURIComponent(search_term)
    const defstring = "https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(search_term)

    /*Right now its all in one fuction but all these options will be able to be turned on in options */

    GETBASE = await fetch('./database.json', Headers = { 'Content-Type': 'application/json' })
        .then(res => res.json())
        .then(data => {
            const searchupp = search_term.toUpperCase()
            return data.body[searchupp]
        })
        .catch(err => console.error(err));
        

    try {
        DEFBASE = await fetch(await defstring, Headers = { 'Content-Type': 'application/json' })
            .then(res => res.json())
            .then(data => {
                return data[0]['meanings']
            })
            .catch(err => console.error(err));

        console.log(typeof (DEFBASE))

        if (typeof DEFBASE === 'undefined') { }
        else {
            for (let i = 0; i < DEFBASE.length; i++) {
                let item = DEFBASE[i];
                let termObj = {};
                termObj['TITLE'] = search_term + " (WORD)"
                termObj['SOURCE'] = defstring
                termObj['DESCRIPTION'] = await item["definitions"][0]["definition"]
                termObj['ABBREVIATIONS'] = "Definition api"
                deform.push(termObj);
            }
        }
    } catch (error) {

        console.log(deform.length)

    }


    console.log(deform.length)










    let results = [];
    let xmlDoc = await fetch(searchstring);

    xmlDoc = await xmlDoc.text();
    console.log()
    console.log()
    let parser = new DOMParser();
    console.log("test ")

    xmlDoc = parser.parseFromString(xmlDoc, 'text/xml');
    console.log("test1 ")
    let listOfAcronymElements = xmlDoc.getElementsByTagName('found')[0].children;
    for (let i = 0; i < listOfAcronymElements.length; i++) {
        let item = listOfAcronymElements[i];
        let termObj = {};
        termObj['TITLE'] = search_term
        termObj['SOURCE'] = searchstring
        termObj['DESCRIPTION'] = item.getElementsByTagName('expan')[0].textContent;
        termObj['ABBREVIATIONS'] = item.getElementsByTagName('comment')[0].textContent;
        results.push(termObj);
    }
    console.log("test ")





















    try {
        try {
            for (let i = 0; i < GETBASE.length; i++) {
                console.log("GB results: ", i)
                alldata.push(await GETBASE[i])

            }
        } catch (e) {
            console.log(e)
        }


        try {
            for (let i = 0; i < results.length; i++) {
                console.log("test results: ", i)
                alldata.push(await results[i])

            }
        } catch (er) {
            console.log(e)
        }

        try {
            for (let i = 0; i < deform.length; i++) {
                console.log("DEF results: ", i)
                alldata.push(await deform[i])
            }
        } catch (errorrr) {
            console.log(errorrr)
        }

    }

    catch (error) {
        console.log(error)
    }








    return await alldata;
}
const constructResultsNotFoundComponent = () => {
    document.getElementsByClassName('no-results-wrapper')[0].innerHTML = '';
    if (current_page != total_pages || current_item)
        return //Literally do nothing if these two conditions are not met
    let noResultsComponent = `
        <h2 class="no-results-header">No Results</h2>
        <hr></hr>
        <div class="search-site-prompt">Search on website? <a href="index.html">Click Here</a></div>
        `;
    document.getElementsByClassName('no-results-wrapper')[0].innerHTML = noResultsComponent;

}
const handleDeployTermPage = (current_term) => {
    current_item = current_term;
    //First, remember to nuke both pagination and term results
    document.getElementsByClassName('result-wrapper')[0].innerHTML = '';
    document.getElementById('pagination').innerHTML = '';
    constructResultsNotFoundComponent();
    const buildAbbreviations = (abbrStrings) => {
        const splitAbbreviations = abbrStrings.split(', ');
        let abbrHTML = ''
        //Gonna let Jesus take the wheel and pray no abbreviations make use of commas
        splitAbbreviations.forEach((abbr) => {
            abbrHTML += `<div class="term-page-abbr">${abbr}</div>`
        })
        return abbrHTML;
    }
    //cache previous page, or at least the params that denote the previous page, and provide a page that focuses on term-related info
    //Nevermind the params that denoted the previous page are stored as globals

    const termPage = `
    <div class="term-page">
        <image src="images/xmark.png" id="quit-term-page"/>
        <div class="term-page-title">${current_term.TITLE}</div>
        <div class="term-page-description">${current_term.DESCRIPTION ? current_term.DESCRIPTION : `None`}</div>
        <div class="term-page-abbreviations">
            <div class="term-page-abbr-header">Abbreviations / Stands For</div>
            <div class="term-page-abbr-flex">${current_term.ABBREVIATIONS ? buildAbbreviations(current_term.ABBREVIATIONS) : `<div class="term-page-abbr">None</div>`}</div>
        </div>
        <div class="term-page-sources">
            <div class="term-page-source-header">Defined in: </div>
            <div class="term-page-source-list">${current_term.SOURCE ? current_term.SOURCE : 'N/A'}</div>
        </div>
    </div>
    `;
    document.getElementsByClassName('result-wrapper')[0].innerHTML = termPage;
    document.getElementById('quit-term-page').addEventListener('click', () => {
        current_item = null;
        constructPage(current_page, total_pages, currentItems)
    });
}
const constructPagination = (current_page, total_pages) => {
    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = '';
    paginationElement.innerHTML = `
    <div class="flex-center">
        <div class="pagination_element" id="pagination">
            <div id="prev_page" class="pagination_left"><img class="chevron_pagi" src="images/chevron-left-solid.png"></div>
            <div class="pagination_page">
                <input id="current_page" value="${current_page}"/>
                <div class="slash">/</div>
                <div id="total_pages">${total_pages}</div>
            </div>
            <div id="next_page" class="pagination_right"><img class="chevron_pagi" src="images/chevron-right-solid.png"></div>
        </div>
    </div>
    
    `;

    const prev_page = document.getElementById('prev_page');
    const next_page = document.getElementById('next_page');
    const current_page_input = document.getElementById('current_page')


    next_page.addEventListener('click', () => {
        handleNextPage();
    })
    prev_page.addEventListener('click', () => {
        handlePrevPage();
    })
    current_page_input.addEventListener('keydown', (e) => {
        if (e.key === "Enter")
            handleGetPage(parseInt(e.target.value));
    })
}

const constructPage = (current_page, total_pages, page_items = [], is_external = false) => {
    //Empty the page
    document.getElementsByClassName('result-wrapper')[0].innerHTML = "";
    //assume that page_items is an array of term objects
    page_items.map((term, index) => {
        let title = term.TITLE;
        let definition_or_abbreviations = term.DESCRIPTION ? (term.DESCRIPTION.length > 45 ? term.DESCRIPTION.substr(0, 45) + '...' : term.DESCRIPTION) : term.ABBREVIATIONS;
        let standards = term.SOURCE ? term.SOURCE : "";
        // Identify each of the term windows with the index of the term, which then helps for setting event listeners on click
        document.getElementsByClassName("result-wrapper")[0].innerHTML +=
            `
        <div class="term-result-window ${is_external ? 'external' : ''}"> 
            <div class="term-result">
                ${title}
            </div>
            <div class="term-definition">
                ${definition_or_abbreviations}
            </div>
            <div class="term-standard-organization">
                ${standards}
            </div>
        </div> 

        `
    });

    //Once all results have been put into DOM, assign event listeners to each that detect the click and perform the corresponding action

    page_items.forEach((term, index) => {
        const termButton = document.getElementsByClassName(`term-result-window`)[index];
        termButton.addEventListener('click', () => {
            handleDeployTermPage(term)
        })
    })

    //Once event listeners are instantiated, then focus on pagination
    constructPagination(current_page, total_pages);

    constructResultsNotFoundComponent();
}




const getSearchOptions = async () => {
    return new Promise((resolve, reject) => {
        return chrome.storage.local.get(['search_options'], (result) => {
            if (Object.keys(result).length == 0) // IF the search_options have not been set, then populate as default
            {
                //These are the default settings. Right now, just results_per_page
                const default_search_options = {
                    results_per_page: 3,
                }
                return chrome.storage.local.set({ 'search_options': JSON.stringify(default_search_options) }, async () => {
                    resolve(default_search_options)
                })
            }
            resolve(result.search_options)
        })
    })
}
const handleGetPage = async (desired_page) => {
    if (!Number.isInteger(desired_page) || desired_page > total_pages || desired_page < 1)
        return null;
    current_page = desired_page;
    if (current_search.length > 0) {
        let sent = chrome.runtime.sendMessage({
            searchTerm: current_search,
            page: current_page,
            results_per_page: 3
        })
        sent.then(handleResponse, handleError)
    }
}
const handleNextPage = async () => {
    if (current_page + 1 > total_pages)
        return null;
    current_page = current_page + 1;
    if (current_search.length > 0) {
        let sent = chrome.runtime.sendMessage({
            searchTerm: current_search,
            page: current_page,
            results_per_page: 3
        })
        sent.then(handleResponse, handleError)
    }
}
const handlePrevPage = async () => {
    if (current_page - 1 < 1)
        return null;
    current_page = current_page - 1
    await getSearchOptions().then(async (search_options) => {
        let search_options_json = JSON.parse(search_options);

        if (current_search.length == 0)
            return null;
        else {
            let sent = chrome.runtime.sendMessage({
                searchTerm: current_search,
                page: current_page,
                results_per_page: 3
            })
            sent.then(handleResponse, handleError)
        }
    })
}
const handleSearchButtonActions = async () => {
    await getSearchOptions().then(async (search_options) => {
        let search_options_json = JSON.parse(search_options);

        //setting global values
        current_search = document.getElementById("term").value;
        current_page = 1;
        total_pages = 1;

        if (current_search.length == 0)
            return null; //aka do nothing
        else {
            let sent = chrome.runtime.sendMessage({
                searchTerm: current_search,
                page: 1,
                results_per_page: 3,
            })
            sent.then(handleResponse, handleError)
        }
    })

}

const leaveDetailedTermWindow = () => {

}



//First, grab the button element from the popup dom
const getButton = document.getElementById("getButton");
// Then, add an event listener to the button so that when the button is clicked-> send the data to the content script
getButton.addEventListener("click", () => {
    handleSearchButtonActions();
})

/**
 * @note @func handleResponse has been restructured and now handles data differently
 * @param {object} message 
 */
//handleResponse
const handleResponse = async (message) => {
    if (message.acronymAPI)
        return;
    total_pages = message.total_pages;
    currentItems = message.results;
    constructPage(current_page, total_pages, currentItems)
}
const handleError = (err) => {
    console.log("Error ocurred: " + err);
}
