/**
 * Created by myBestFreind on 20-04-2017.
 */
const collExp = require('../models/collExpirations');
const collProduct = require('../models/product');
const collUsers = require('../models/user');
const BARCODE_REGEX = /^\d{8}|\d{13}|\d{15}$/;
const mongoose = require('mongoose');

exports.createCollExpiration = (barcode, date, quantity) => {
    let tmpItem = new collExp({
        barcode: barcode,
        date: date,
        quantity: quantity
    });
    tmpItem.save();
    return tmpItem;
};

exports.getCollExpiration = (barcode, date, quantity) => {
    let query = collExp.findOne({barcode: barcode, date: date, quantity: quantity});
    return query.exec(function (err, docs) {
        if (err) return err;
        else {
            return docs;
        }
    });
};

exports.getAllCollExpirations = () => {
    let query = collExp.find({});
    return query.exec(function (err, docs) {
        if (err) return err;
        else {
            return docs;
        }
    });
};

exports.deleteCollExpiration = (id) => {
    collExp.findOne({_id: id}, function (err, doc) {
        doc.remove((err) => {
            if (err) {
                return err;
            }
        })
    });
};

function deleteExpirationsByBarcode(barcode) {
    let query = collExp.find({barcode: barcode});
    return query.exec(function (err, docs) {
        if (err) return err;
        else {
            for(let i = 0; i < docs.length; i++) {
                docs[i].remove();
            }
        }
    });
}

exports.getExpByBarcodeToday = (id) => {
    let today = new Date();
    today.setUTCHours(0,0,0,0);

    let query = collExp.find({barcode: id, date: {$gte: today}});
    return query.exec((err, docs) => {
        if (err) return err;
        else {
            return docs;
        }
    });
};

exports.deleteProduct = (id) => {
    deleteExpirationsByBarcode(id);

    collProduct.findOne({_id: id}, function (err, doc) {
        doc.remove((err) => {
            if (err) {
                return err;
            }
        })
    });
};

exports.getCollExpirationById = (id) => {
    return collExp.findById(id).exec((err, docs) => {
        if (err) return err; else return docs;
    });
};

exports.updateCollExpiration = (oldId, newBarcode, newDate, newQuantity) => {
    let query = collExp.findByIdAndUpdate(oldId, {
        barcode: newBarcode,
        date: newDate,
        quantity: newQuantity
    }, {new: true});
    return query.exec(function (err, doc) {
        if (err) return err;
        else {
            return doc;
        }
    });
};

exports.updateQuantityCollExpiration = (id, quantity, isChecked) => {
    let query = collExp.findByIdAndUpdate(id, {
        quantity: quantity,
        isChecked: isChecked
    }, {new: true});
    return query.exec(function (err, doc) {
        if (err) return err;
        else {
            return doc;
        }
    });
};

exports.createProduct = function (id, name, isDryGoods, orderNumber) {
    return new Promise ((resolve, reject) => {
        if (name.length > 0
            && typeof(id) === 'string'
            && BARCODE_REGEX.test(id)) {

            let newProduct = new collProduct({
                _id: id,
                name: name,
                isDryGoods: isDryGoods,
                orderNumber: orderNumber
            });

            newProduct.save().then(resolve);
        } else {
           reject();
        }
    });
};

exports.updateCollProducts = (id, newName, newIsDryGoods) => {

    collProduct.findOne({_id: id}, function (err, doc) {
        doc.name = newName;
        doc.isDryGoods = newIsDryGoods;
        doc.save((err) => {
            if (err) {
                return err;
            }
        })
    });
};

exports.getCollProductById = (id) => {

    let query =  collProduct.findById(id);
    return query.exec((err,docs) => {
        if(err) return err;
        else return docs;
    });
};

//TODO: sender en liste med expirations fra i dag / ligger lige nu i script på klientsiden
exports.getExpToday = (inputDate) => {
    var query = collExp.find({date: inputDate});
    return query.exec(function (err, docs) {
        if (err) return err;
        else {
            return docs;
        }
    });
};


// exports.getProductsFromToday = () => {
//     return new Promise((resolve, reject) => {
//         let tempArr = [];
//         let inputDate = new Date();
//         inputDate.setUTCHours(0, 0, 0, 0);
//         let query = collExp.find({date: inputDate});
//
//         query.exec(function (err, docs) {
//             return docs;
//         }).then((docs) => {
//             return new Promise((resolve, reject) => {
//                 for (let i = 0; i < docs.length; i++) {
//                     tempArr.push(docs[i].barcode);
//                 }
//                 resolve();
//             })
//         }).then(() => {
//             return new Promise((resolve, reject) => {
//                 let query = collProduct.find({_id: tempArr});
//                 query.exec(function (err, docs) {
//                     if (err) {
//                         return err;
//                     } else resolve(docs);
//                 });
//             })
//         }).then((docs) => {
//             resolve(docs);
//         });
//     });
// };

exports.getProductsToday = () => {
    return new Promise((resolve, reject) => {
        let today = new Date();
        today.setUTCHours(0,0,0,0);

        let query = collProduct.aggregate([{
            $lookup:
                {
                    from: 'collExpirations',
                    localField: '_id',
                    foreignField: 'barcode',
                    as: 'expirations'
                }
        }]);

        query.exec(function (err, docs) {

            if (err) {
                reject(err);
            } else {
                let tmpArr = [];

                for(let i = 0; i < docs.length; i++) {
                    if(docs[i].expirations.length === 0) {
                        tmpArr.push(docs[i]);
                    } else {
                        let latestDate = docs[i].expirations[0];

                        for(let n = 0; n < docs[i].expirations.length; n++) {
                            let tempExpiration = docs[i].expirations[n].date;
                            tempExpiration.setUTCHours(0,0,0,0);
                            console.log(tempExpiration);


                            if(tempExpiration >= today) {
                                latestDate = tempExpiration;
                            }
                        }

                        if(latestDate.toString() == today.toString()) {
                            tmpArr.push(docs[i])
                        }
                    }
                }
                resolve(tmpArr);
            }
        });
    });
};

exports.filterGetProductsTodayByIsDryGoods = (isDryGoods) => {
        return new Promise((resolve, reject) => {
            let today = new Date();
            today.setUTCHours(0,0,0,0);
            let tempBoolean = (isDryGoods == 'true');

            let query = collProduct.aggregate([
                {
                    $match: {isDryGoods: tempBoolean}
                },
                {
                    $lookup:
                        {
                            from: 'collExpirations',
                            localField: '_id',
                            foreignField: 'barcode',
                            as: 'expirations'
                        }
                }
            ]);

            query.exec(function (err, docs) {

                if (err) {
                    reject(err);
                } else {
                    let tmpArr = [];

                    for(let i = 0; i < docs.length; i++) {
                            if(docs[i].expirations.length === 0) {
                                tmpArr.push(docs[i]);
                            } else {
                                let latestDate = docs[i].expirations[0];

                                for(let n = 0; n < docs[i].expirations.length; n++) {
                                    let tempExpiration = docs[i].expirations[n].date;
                                    tempExpiration.setUTCHours(0,0,0,0);

                                    if(tempExpiration >= today) {
                                        latestDate = tempExpiration;
                                    }
                                }

                                if(latestDate.toString() == today.toString()) {
                                    tmpArr.push(docs[i])
                                }
                            }
                    }
                    resolve(tmpArr);
                }
            });
        });
};

exports.filterGetProductsTodayByDate = (date) => {
    return new Promise((resolve, reject) => {
        date.setUTCHours(0,0,0,0);

        let query = collProduct
            .aggregate([{
            $lookup:
                {
                    from: 'collExpirations',
                    localField: '_id',
                    foreignField: 'barcode',
                    as: 'expirations'
                }}]);

        query.exec(function (err, docs) {
            if (err) {
                reject(err);
            } else {
                let tmpArr = [];

                for(let i = 0; i < docs.length; i++) {
                    if(docs[i].expirations.length > 0 && docs[i].expirations[0].date.toString() === date.toString()) {
                        tmpArr.push(docs[i]);
                    }
                }
                resolve(tmpArr);
            }
        });
    });
};

exports.getCollProductByOrderNumber = orderNumber => {

    let query =  collProduct.find({"orderNumber": orderNumber});
    return query.exec((err,docs) => {
        if(err) return err;
        else return docs;
    });
};

// Opretter en ny bruger i systemet.
exports.createUser = function (name, password) {
    return new Promise ((resolve, reject) => {
        if (true) {
            let newUser = new collUsers({
                name: name,
                password: password
            });

            newUser.save().then(resolve);
        } else {
            reject();
        }
    });
};

exports.hasUsername = function (username) {
    let query =  collUsers.find({"name": username});
    return query.exec((err,docs) => {
        if(err) return err;
        else {
            return docs;
        }
    });
}