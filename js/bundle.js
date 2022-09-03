//BRR
//"https://docs.google.com/spreadsheets/d/e/2PACX-1vRpEYi7ap7o89ZILw58orkWksC2MlsOWS9Q4loIXgb46qfKxRNp01QmY-FGwHLi5NZNz80Aa_k3Pjt5/pub?gid=1612863274&single=true&output=csv";
const dataURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZmYvJRU25HAiWMu6xscYINvLxMWmTNls474hTIczFrnMI_afgtaXl5PPUwiSIfU0L6Zjfhn9wtv03/pub?gid=0&single=true&output=csv";
const configURL = "data/config.json";
const dictURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZmYvJRU25HAiWMu6xscYINvLxMWmTNls474hTIczFrnMI_afgtaXl5PPUwiSIfU0L6Zjfhn9wtv03/pub?gid=238404823&single=true&output=csv";

let config;
let resourcesData,
    filteredResourcesData,
    dictionary;

let dataTable;
let advancedSearchItems = [];


$(document).ready(function() {
    function getData() {
        Promise.all([
            d3.json(configURL),
            d3.csv(dataURL),
            d3.csv(dictURL)
        ]).then(function(data) {
            config = data[0];
            resourcesData = data[1];
            filteredResourcesData = resourcesData;

            dictionary = data[2];

            // set in config Dropdowns the data from dictionary
            for (k in config.Dropdowns) {
                const drop = config.Dropdowns[k].name;
                for (let index = 0; index < dictionary.length; index++) {
                    const tupl = dictionary[index];
                    if (tupl.key == drop) {
                        config.Dropdowns[k].data = formatListToArray(tupl.value);
                        break;
                    }
                }
            }

            // for (k in config.Dropdowns) {
            //     console.log(config.Dropdowns[k])
            // }
            generateTags();

            createHtmlTable();

            // create advanced search items (select and tags)
            for (k in config.Dropdowns) {
                const id = config.Dropdowns[k].id;
                if (id != "null") {
                    generateAdvancedSearchItem(k);
                }
            }

            var tagButtons = document.getElementsByClassName("advancedTag");
            for (var i = 0; i < tagButtons.length; i++) {
                tagButtons[i].addEventListener('click', addTagtoFilter);
            }

            generateDataTable();
            dataTable.columns.adjust().draw();

        }); // then
    } // getData

    getData();

});

function generateAdvancedSearchItem(name) {
    var type = "",
        id = "",
        data;
    var html;

    for (k in config.Dropdowns) {
        if (String(config.Dropdowns[k].name) === String(name)) {
            type = config.Dropdowns[k].type;
            data = config.Dropdowns[k].data;
            id = config.Dropdowns[k].id;
            break;
        }
    }
    const classeName = name.toLowerCase();
    if (type == "tag") {
        // create tag filter
        var tags = "";
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            tags += '<label><button type="button" class="btn advancedTag" id="' + element + '" value="' + element + '">' + element + '</button></label>';
        }
        html = tags;
    } else {
        // create dropdwown select
        var options = "";
        data.unshift('Select all'); // finalement done in the
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            i == 0 ? options += '<option value="all" selected>' + element + '</option>' :
                options += '<option value="' + element + '">' + element + '</option>';
        }
        html = options;
    }
    $('#' + id).append(html);
} //generateAdvancedSearchItem

function getSelectedTags(elementID) {
    var items = $("#" + elementID + " label button");
    var selections = [];
    items.each(function(idx, btn) {
        const isSelected = $(btn).hasClass('is-selected');
        isSelected ? selections.push($(btn).val()) : null;
    });
    return selections;
} //getSelectedTags

function generateTags() {
    var tagsToDisplay = '<label><strong>Filter by: </strong></label><label><button type="button" class="btn tagFilter tag-all active" id="all" value="all">All</button></label>';
    const tagsArr = config.Tags;
    for (let index = 0; index < tagsArr.length; index++) {
        const tag = tagsArr[index],
            tagId = slugify(tag),
            classname = 'tag-' + tagId;
        tagsToDisplay += '<label><button type="button" class="btn tagFilter ' + classname + '" id="' + classname + '" value ="' + tagId + '">' + tag + '</button></label>';

    }
    $('.dimensionFilter').html('');
    $('.dimensionFilter').append(tagsToDisplay);

    var tagButtons = document.getElementsByClassName("tagFilter");
    for (var i = 0; i < tagButtons.length; i++) {
        tagButtons[i].addEventListener('click', clickButton);
    }

} //generateTags


// Creer a partir de la liste de config.TableHeadersCleaned les entetes de la table
function createHtmlTable() {
    $('#datatable').html('');
    var arr = config.TableHeadersCleaned;
    var table = "<thead><tr><th></th>";
    for (let index = 0; index < arr.length; index++) {
        const element = arr[index];
        table += '<th>' + element + '</th>';
    }
    table += '</tr></thead>';
    $('#datatable').html(table);

} //createHtmlTable

function slugify(texte) {
    return texte.toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

function formatListToArray(liste) {
    var items = [];
    var arr = liste.split(",");
    var trimedArr = arr.map(x => x.trim());
    for (let index = 0; index < trimedArr.length; index++) { //remove empty elements
        if (trimedArr[index]) {
            items.push(trimedArr[index]);
        }
    }
    return items;
} //formatListToArray 

// get dimensions formatted in tags using sep = comma
function getFormattedDimension(item) {
    var items = formatListToArray(item);

    var formatedDims = "";
    items.forEach(element => {
        var className = slugify(element);
        formatedDims += '<label class="alert tag-' + className + '">' + element + '</label>';
    });
    return formatedDims;
} //getFormattedDimension

// generer une array de donnees basee sur la structure de la table
function getDataTableData(data = filteredResourcesData) {
    var dt = [];
    var headers = config.OthersTableColumns;
    data.forEach(element => {
        var document = "";
        for (let index = 0; index < headers.length; index++) {
            const hd = headers[index];
            var val = element[hd];
            hd == "Title" ? document += '<h5>' + val + '</h5>' :
                hd == "Summary" ? document += '<h6>' + val + '</h6>' : document += '<p>' + val + '</p>';
        }
        dt.push([element[config.id], document])
    });
    return dt;
} //getDataTableData

function generateDataTable() {
    var dtData = getDataTableData();
    dataTable = $('#datatable').DataTable({
        data: dtData,
        bAutoWidth: false,
        aoColumns: [
            { sWidth: null },
            { sWidth: '100%', target: 1 }
        ],

        "columnDefs": [{
                "className": "dt-head-left",
                "targets": "_all"
            },
            {
                "defaultContent": " No document found",
                "targets": "_all"
            },
            { "targets": [0], "visible": false }
            // { "targets": [8], "visible": false }, { "targets": [9], "visible": false }, { "targets": [10], "visible": false },
            // { "searchable" : true, "targets": "_all"},
            // {"type": "myDate","targets": 4}
        ],
        // "pageLength": 10,
        // "fixedHeader": true,
        "paging": false,
        // "bLengthChange": false,
        // "pagingType": "simple_numbers",
        "order": false,
        "dom": "Blrt"
    });

    dataTable.columns.adjust().draw();
} //generateDataTable


function updateDataTable(data = filteredResourcesData) {
    var dt = getDataTableData(data);
    $('#datatable').dataTable().fnClearTable();
    $('#datatable').dataTable().fnAddData(dt);

} //updateDataTable

// search button
$('#searchInput').keyup(function() {
    dataTable.search($('#searchInput').val()).draw();
});

$("#more-filters").on("click", function() {
    var moreFiltersOpen = d3.select(".advanced-filters").classed("hidden");
    if (moreFiltersOpen) {
        d3.select(".advanced-filters").classed("hidden", false)
    } else {
        d3.select(".advanced-filters").classed("hidden", true)
    }
});


function addTagtoFilter() {
    $('.advancedTag').removeClass('active');
    const isSelected = $(this).hasClass('is-selected');
    if (!isSelected) {
        $(this).addClass('is-selected');
    } else {
        $(this).removeClass('is-selected');
    }
} //addTagtoFilter


$("#search-apply").on("click", function() {
    updateData();
    updateDataTable();

});

$("#reset").on("click", function() {
    for (k in config.Dropdowns) {
        const id = config.Dropdowns[k].id;
        if (id != "null") {
            const type = config.Dropdowns[k].type;
            if (type === "tag") {
                // tags
                $("#" + id + " label button").each(function(index, btn) {
                    $(btn).hasClass('is-selected') ? $(btn).removeClass('is-selected') : null;
                });
            } else {
                // select
                $('#' + id).val("all");
            }
        }
    }
    filteredResourcesData = resourcesData;
    updateDataTable();
});


// test two arrays : test if a element from arr is included in itemArr
function compareArrays(itemArr, arr) {
    var included = false;
    for (var i = 0; i < arr.length; i++) {
        if (itemArr.includes(arr[i])) {
            included = true;
            break;
        }
    }
    return included;
}

function updateData() {
    var data = resourcesData;
    for (k in config.Dropdowns) {
        const id = config.Dropdowns[k].id;
        // make sure the DOM element exists
        if (id != null) {
            const type = config.Dropdowns[k].type;
            var arr = [];
            if (type === "tag") {
                // tags
                const selectionTagArr = getSelectedTags(id);
                if (selectionTagArr.length != 0) {
                    data = data.filter(d => { return compareArrays(formatListToArray(d[k]), selectionTagArr); });
                }
            } else if (type === "select") {
                // select
                const selection = $('#' + id).val();
                if (selection != "all") {
                    data = data.filter(d => { return formatListToArray(d[k]).includes(selection); });
                }

            }
            // filteredResourcesData = data;
        }
    }

    filteredResourcesData = data;

} //updateData