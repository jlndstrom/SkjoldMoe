/**
 * Created by tuxzo on 03-04-2017.
 */
// RENDERING OF PAGES
// =============================================================================
var currentSelectedProduct;
var tmpDates = [];

function compileNewBody(templateName) {
    $.get('../views/' + templateName, function (template) {
        $('#container').empty();
        let compiled = Handlebars.compile(template);
        let html = compiled({});
        $('#container').append(html);
    });
}

function populateProductsToRegister(targetContainer) {
    $.get('/api/productsToday', (req,res) => {
        $(targetContainer).empty();
        for (let i in req) {
            $(targetContainer).append('<li class="list-group-item">'
                + '<label>'+req[i]._id + ' - ' + req[i].name+'</label>'
                + '<div class="pull-right action-buttons">'
                + '<a href="#" data-barcode="' + req[i]._id + '"><span class="glyphicon glyphicon-plus" id="glyphRegisterExp' + req[i]._id + '"></span></a>'
                + '</div></li>');

            $('#glyphRegisterExp' + req[i]._id).on('click', () => {
                    addExpirationsToProduct(req[i]);
            });
        }
    });
}

function populateProductsToRegisterDriedGoods(targetContainer, isDryGoods) {
    $.get('/api/productsToday/' + isDryGoods, (req,res) => {
        $(targetContainer).empty();
        for (let i in req) {
            $(targetContainer).append('<li class="list-group-item">'
                + '<label>'+req[i]._id + ' - ' + req[i].name+'</label>'
                + '<div class="pull-right action-buttons">'
                + '<a href="#" data-barcode="' + req[i]._id + '"><span class="glyphicon glyphicon-plus" id="glyphRegisterExp' + req[i]._id + '"></span></a>'
                + '</div></li>');

            $('#glyphRegisterExp' + req[i]._id).on('click', () => {
                addExpirationsToProduct(req[i]);
            });
        }
    });
}

function populateSortimentList() {
    $('#stockList').empty();

    $.get('/api/products', (req, res) => {
        for (let i in req) {
            $('#stockList').append('<li class="list-group-item">'
                    + '<label>'+req[i]._id + ' - ' + req[i].name+'</label>'
                    + '<div class="pull-right action-buttons">'
                    + '<a href="#" data-barcode="' + req[i]._id + '"><span class="glyphicon glyphicon-pencil" id="glyphEdit' + req[i]._id + '"></span></a>'
                    + '<a href="#" data-barcode="' + req[i]._id + '"><span  class="glyphicon glyphicon-trash" id="glyphDelete' + req[i]._id + '"></span></a>'
                    + '</div></li>');

            $('#glyphEdit' + req[i]._id).on('click', () => {
                editGoods(req[i]._id, req[i].name, req[i].isDryGoods);
            });

            $('#glyphDelete' + req[i]._id).on('click', () => {
                deleteGoods(req[i]._id);
            });
        }
    });
}

// FUNCTIONS GETTING FROM SERVER
// =============================================================================

function registerExp(barcode, date, quantity) {
    return new Promise((resolve, reject) => {
        $.post('./api/collExpirations/', {
            'barcode': barcode,
            'date': date,
            'quantity': quantity
        })
            .done(function (data) {
                    console.log(data);
                    resolve();
                }
            ).fail(() => {
            alert("Kunne ikke oprette datoregisteringen");
            reject();
        })
    });
}

function editGoods(barcode, name, isDryGoods) {
    $('#editGoodsModal').modal("show");
    $('#nameModal').val(name);
    $('#barcodeModal').val(barcode);

    if (isDryGoods) {
        $('#chbIsDryGoodsModal').prop('checked', true);
    } else {
        $('#chbIsDryGoodsModal').prop('checked', false);
    }

    $('#btnOpdaterModal').click(() => {
        if ($('#nameModal').val() != name || $('#chbIsDryGoodsModal').is(':checked') != isDryGoods) {
            updateProduct($('#barcodeModal').val(), $('#nameModal').val(), $('#chbIsDryGoodsModal').is(':checked'));
        }
    })
}

function deleteGoods(barcode) {
    if (window.confirm("Vil du virkelig slette " + barcode + "?")) {
        $.ajax({
            type: "DELETE",
            url: "/api/products/" + barcode,
        }).done(() => {
            alert("Varen blev slettet.");
            populateSortimentList();
        });
    }
}

function updateProduct(barcode, name, isDryGoods) {
    let updatedProduct = {'_id': barcode, 'name': name, 'isDryGoods': isDryGoods};
    $.ajax({
        type: "PUT",
        url: "/api/products/",
        contentType: "application/json",
        data: JSON.stringify(updatedProduct)
    }).done(() => {
        alert("Varen blev opdateret succesfuldt.");
        populateSortimentList();
    });
}

function addExpirationsToProduct(product) {
    $('#dateRegModal').modal("show");
    $('#dateRegModalBody').empty();
    currentSelectedProduct = product;

    if(product.expirations.length > 0) {
        let req = product.expirations;
        for (let i in req) {
            $('#dateRegModalBody').append('<li class="list-group-item">'
                + '<label>'+req[i].date.slice(0,10) + '</label>'
                + '<div class="pull-right action-buttons">'
                + '<a href="#" data-barcode="' + req[i].barcode + '"><span class="glyphicon glyphicon-pencil" id="modalGlyphEdit' + req[i].barcode + '"></span></a>'
                + '<a href="#" data-barcode="' + req[i].barcode + '"><span  class="glyphicon glyphicon-trash" id="modalGlyphDelete' + req[i].barcode + '"></span></a>'
                + '</div></li>');

            // $('#modalGlyphEdit' + req[i].barcode).on('click', () => {
            //     editGoods(req[i].barcode, req[i].name, req[i].isDryGoods);
            // });

            // $('#modalGlyphDelete' + req[i].barcode).on('click', () => {
            //     deleteGoods(req[i].barcode);
            // });
        }
    }

};

function addItemsToExpirationLists(){
    $.get('/api/collExpirations', (req, res) =>{
        for(let i in req){
            var currentDate = new Date;
            var month = currentDate.getMonth();
            month = monthConverter(month);
            var currentDateString = currentDate.getFullYear() + '-' + month + '-' + currentDate.getDate();

            var productDate = req[i].date;
            var productDateString = productDate.slice(0,10);

            if(productDateString === currentDateString){
                $.get('/api/products/' + req[i].barcode, (product, res2) =>{
                    var listLocation = 'fresh';
                    if(product.isDryGoods){
                        listLocation = 'dry';
                    }
                    var quantity = req[i].quantity;
                    var okGlyphicon = '';
                    if(quantity == 0){
                        quantity = '';
                    }else {
                        quantity = 'value =' + quantity;
                        okGlyphicon = '<span id="saveBtn" class="glyphicon glyphicon-ok"></span>';
                    }
                    $('#' + listLocation + 'Goods').append('<tr  data-barcode="'+product._id+'" data-id="'+req[i]._id+'"><td>'+product.name+'</td><td><input id="numSelect" type="number" '+quantity+'></td><td><span id="saveBtn" class="glyphicon glyphicon-floppy-disk"></span>'+okGlyphicon+'</td></tr>')
                });
            }
        }
    });
    function monthConverter(month) {
        month = month +1;
        if(month<10){
            month = '0' + month;
        }
        return month
    }
};


$(document).ready(function () {
    addItemsToExpirationLists();

// BUTTON ACTIONS
// =============================================================================

    function toggleButtons() {
        $('#btnDatoliste').removeClass('active');
        $('#btnRegistrer').removeClass('active');
        $('#btnSortiment').removeClass('active');
    }

    $('#btnDatoliste').click(function () {
        compileNewBody("index.hbs");
        toggleButtons();
        $('#btnDatoliste').addClass('active');
        addItemsToExpirationLists();
    });

    $('#btnRegistrer').click(function () {
        compileNewBody("registrer.hbs");
        populateProductsToRegister('#tabRegAllContent');
        toggleButtons();
        $('#btnRegistrer').addClass('active');
    });

    $('#btnSortiment').click(function () {
        compileNewBody("sortiment.hbs");
        populateSortimentList();
        toggleButtons();
        $('#btnSortiment').addClass('active');
    });

    // TODO skal have opdateret vores varer på listen med en ny glyphicon og antal
    // gemmer det nye antal af varer
    $(document).on('click', '#saveBtn', (event)=> {

        var id = $(event.target.parentNode.parentNode).data('id');
        var quantity = $(event.target.parentNode.previousSibling.firstChild).val();

        $.ajax({
            type: "PUT",
            url: "/api/collExpirations/" + id,
            contentType: "application/json",
            data: JSON.stringify({quantity: quantity})
        }).done(() => {
            if(!$(event.target.parentNode.lastChild).hasClass("glyphicon glyphicon-ok")){
                $(event.target.parentNode).append('<span id="saveBtn" class="glyphicon glyphicon-ok"></span>');
            }
        });

    });

    $(document).on('click', '#btnCreateProduct', function () {

        let newProduct = {
            _id: $('#newProductBarcode').val(),
            name: $('#newProductName').val(),
            isDryGoods: $('#isDryGoods').is(':checked')
        };

        $.post("/api/products", newProduct, function (data) {
            alert("Varen blev oprettet succesfuldt!");
        }).done(() => {
            $('#newProductBarcode').val("");
            $('#newProductName').val("");
            $('#isDryGoods').prop('checked', false);
            populateSortimentList();
        });
    });

    $(document).on('click', 'li', (event) => {
        $('#selectedProductBarcode').val($(event.target).data('barcode'));
    });

    $(document).on('click', '#btnCreateExpiration', function () {
        let barcode = $('#selectedProductBarcode').val();
        console.log("testStory4 script: selected barcode val: " + barcode);
        let date = $('#expDate').val();
        console.log("testStory4 script: selected barcode val: " + date);

        registerExp(barcode, date, 0).then(() => {
            $('#selectedProductBarcode').val('');
            $('#expDate').val('');
        });
    });

    $(document).on('click', '#tabRegAll', (event) => {
        populateProductsToRegister('#tabRegAllContent');
    });

    $(document).on('click', '#tabRegFresh', (event) => {
        populateProductsToRegisterDriedGoods('#tabRegFreshContent', "true");
    });

    $(document).on('click', '#tabRegDried', (event) => {
        populateProductsToRegisterDriedGoods('#tabRegDriedContent', "false");
    });

    $(document).on('click', '#tabRegFromDate', (event) => {
        $('#tabRegFromDateContent').empty();
        $('#tabRegFromDateContent').append("Coming soon this christmasX!");
    });

    $(document).on('click', '#btnDateRegModalGodkend', (event) => {

        let promises = [];

        for(let i = 0; i < tmpDates.length; i++) {
            promises.push(registerExp(tmpDates[i].barcode, tmpDates[i].date, tmpDates[i].quantity));
        }

        Promise.all(promises).then(() => {
            populateProductsToRegister('#tabRegAllContent');
        })

    });

    $(document).on('click', '#btnDateRegModalTilfoej', (event) => {
        let newCollExp = {
            barcode: currentSelectedProduct._id,
            date: $('#dateRegDatePickerModal').val(),
            quantity: 0
        };
        console.log("Skabt øbjekt: " + newCollExp + " validere");
        if(newCollExp.barcode.length > 0)
            console.log("trin 1");
            if(newCollExp.date != '')
            {
                console.log("trin 2");
                tmpDates.push(newCollExp);

                $('#dateRegModalBody').append('<li class="list-group-item">'
                    + '<label>'+newCollExp.date.slice(0,10) + '</label>'
                    + '<div class="pull-right action-buttons">'
                    + '<a href="#" data-barcode="' + newCollExp.barcode + '"><span class="glyphicon glyphicon-pencil" id="modalGlyphEdit' + newCollExp.barcode + '"></span></a>'
                    + '<a href="#" data-barcode="' + newCollExp.barcode + '"><span  class="glyphicon glyphicon-trash" id="modalGlyphDelete' + newCollExp.barcode + '"></span></a>'
                    + '</div></li>');

                // $('#modalGlyphEdit' + req[i].barcode).on('click', () => {
                //     editGoods(req[i].barcode, req[i].name, req[i].isDryGoods);
                // });

                // $('#modalGlyphDelete' + req[i].barcode).on('click', () => {
                //     deleteGoods(req[i].barcode);
                // });

                newCollExp = '';
                $('#dateRegDatePickerModal').val('');
            }

    })

});