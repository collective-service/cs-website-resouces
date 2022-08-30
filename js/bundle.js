//BRR
//"https://docs.google.com/spreadsheets/d/e/2PACX-1vRpEYi7ap7o89ZILw58orkWksC2MlsOWS9Q4loIXgb46qfKxRNp01QmY-FGwHLi5NZNz80Aa_k3Pjt5/pub?gid=1612863274&single=true&output=csv";
const dataURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZmYvJRU25HAiWMu6xscYINvLxMWmTNls474hTIczFrnMI_afgtaXl5PPUwiSIfU0L6Zjfhn9wtv03/pub?gid=0&single=true&output=csv";
const configURL = "data/config.json";

let config;
let resourcesData,
    filteredResourcesData;

let dataTable;

$(document).ready(function() {
    function getData() {
        Promise.all([
            d3.json(configURL),
            d3.csv(dataURL)
        ]).then(function(data) {
            config = data[0];
            resourcesData = data[1];
            filteredResourcesData = resourcesData;

            generateTags();

            createHtmlTable();

            generateDataTable();

        }); // then
    } // getData

    getData();

});

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

function clickButton() {
    $('.btn').removeClass('active');
    var tagSelected = this.value;
    var data = resourcesData;

    if (tagSelected == "all") {
        updateDataTable(data);

    } else {
        var filteredData = data.filter(function(d) {
            var tagArr = getFormattedDimension(d[config.tagsColName]);
            return tagArr.includes(tagSelected) ? d : null;
        });
        updateDataTable(filteredData);
    }

    $(this).toggleClass('active');

} //clickButton

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

// get dimensions formatted in tags
function getFormattedDimension(item) {
    var items = [];
    var arr = item.split(",");
    var trimedArr = arr.map(x => x.trim());
    for (let index = 0; index < trimedArr.length; index++) { //remove empty elements
        if (trimedArr[index]) {
            items.push(trimedArr[index]);
        }
    }
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
    var headers = config.TableHeaders;
    data.forEach(element => {
        var vals = []; //start with the id that is hidden, so i first push "" as first element of the array
        vals.push(element[config.id]);
        for (let index = 0; index < headers.length; index++) {
            const hd = headers[index];
            var val = element[hd];
            if (hd == config.Link) {
                val = '<a href="' + element[hd] + '" target="blank"><i class="fa fa-external-link"></i></a>';
            }
            if (hd == config.tagsColName) {
                val = getFormattedDimension(element[hd]);
            }
            vals.push(val)
        }
        dt.push(vals)
    });
    return dt;
} //getDataTableData

function generateDataTable() {
    var dtData = getDataTableData();
    console.log(dtData)
    dataTable = $('#datatable').DataTable({
        data: dtData,
        "columns": [{ //// taille de la premiere col, source_id qui est hidden
                "className": 'details-control',
                "orderable": false,
                "data": null,
                "defaultContent": '<i class="fa fa-caret-down"></i>',
                "width": "1%"
            },
            { "width": "15%" },
            { "width": "25%" },
            { "width": "10%" },
            { "width": "5%" },
            { "width": "5%" },
            { "width": "5%" }
        ],
        "columnDefs": [{
                "className": "dt-head-left",
                "targets": "_all"
            },
            {
                "defaultContent": "-",
                "targets": "_all"
            },
            // { "targets": [0], "visible": false } // si tu veux creer des colones caches, c'est pour l'export car seules les vals apparentes sont exportees
            // { "targets": [8], "visible": false }, { "targets": [9], "visible": false }, { "targets": [10], "visible": false },
            // { "searchable" : true, "targets": "_all"},
            // {"type": "myDate","targets": 4}
        ],
        // "pageLength": 10,
        // "fixedHeader": true,
        "paging": false,
        // "bLengthChange": false,
        // "pagingType": "simple_numbers",
        "order": [
            [1, 'asc'] // specifie ici le num de colone a sort par defaut
        ],
        "dom": "Blrt"
    });

    $('#datatable tbody').on('click', 'td.details-control', function() {
        var tr = $(this).closest('tr');
        var row = dataTable.row(tr);
        if (row.child.isShown()) {
            row.child.hide();
            tr.removeClass('shown');
            tr.css('background-color', '#fff');
            tr.find('td.details-control i').removeClass('fa fa-caret-right');
            tr.find('td.details-control i').addClass('fa fa-caret-down');
        } else {
            row.child(format(row.data())).show();
            tr.addClass('shown');
            tr.css('background-color', '#f5f5f5');
            $('#cfmDetails').parent('td').css('border-top', 0);
            $('#cfmDetails').parent('td').css('padding', 0);
            $('#cfmDetails').parent('td').css('background-color', '#f5f5f5');
            tr.find('td.details-control i').removeClass('fa-solid fa-caret-down');
            tr.find('td.details-control i').addClass('fa-solid fa-caret-right');

        }
    });

} //generateDataTable

function format(arr) {
    filtered = filteredResourcesData.filter(function(d) { return d['source_id'] == arr[0]; });
    return '<table class="tabDetail" id="cfmDetails" >' +
        '<tr>' +
        '<td>&nbsp;</td>' +
        '<td>&nbsp;</td>' +
        '<td>&nbsp;</td>' + '<td>&nbsp;</td>' +
        '<td>' +
        '<table class="tabDetail" >' +
        '<tr>' +
        '<th><strong>Geo</strong></th>' +
        '<td>Region</td>' +
        '<td>' + filtered[0]['region'] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>&nbsp;</td>' +
        '<td>Countries (' + filtered[0]['country_count'] + ')</td>' +
        '<td>' + filtered[0]['countries'] + '</td>' +
        '</tr>' +

        '<tr>' +
        '<th><strong>Purpose</strong></th>' +
        '<td>Summary</td>' +
        '<td>' + filtered[0]['details'] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>&nbsp;</td>' +
        '<td>Indicators</td>' +
        '<td>' + filtered[0]['variables'] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>&nbsp;</td>' +
        '<td>Target</td>' +
        '<td>' + filtered[0]['target_pop'] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<th><strong>Method</strong></th>' +
        '<td>Survey</td>' +
        '<td>' + filtered[0]['methodology'] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>&nbsp;</td>' +
        '<td>Sample</td>' +
        '<td>' + filtered[0]['sample_type'] + ' - ' + filtered[0]['sample_size'] + ' respondents</td>' +
        '</tr>' +
        '<tr>' +
        '<td>&nbsp;</td>' +
        '<td>Review</td>' +
        '<td>' + filtered[0]['quality_check'] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>&nbsp;</td>' +
        '<td>Comment</td>' +
        '<td>' + filtered[0]['source_comment'] + '</td>' +
        '</tr>' +
        '<tr>' +
        // '<th rowspan="3"><strong>Source</strong></th>'+
        '<th><strong>Source</strong></th>' +
        '<td>Data Type</td>' +
        '<td>' + filtered[0]['access_type'] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>&nbsp;</td>' +
        '<td>Authors</td>' +
        '<td>' + filtered[0]['authors'] + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>&nbsp;</td>' +
        '<td>Publication</td>' +
        '<td>' + filtered[0]['publication_channel'] + '</td>' +
        '</tr>' +
        '</table>' +
        '</td>' +
        '<td>&nbsp;</td>' +
        '</tr>' +
        '</table>'
} //format

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
})