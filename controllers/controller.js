/**
 * Created by kaspe on 05-05-2017.
 */
var collExp = require('../models/collExpirations');
var mongoose = require('mongoose');
mongoose.connect("mongodb://user:1234@ds111461.mlab.com:11461/skjoldmoe").connection;

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
    return collExp.find({barcode: barcode, date: date, quantity: quantity});
};

exports.deleteCollExpiration = (barcode, date, quantity) => {
    collExp.findOneAndRemove({barcode: barcode, date: date, quantity: quantity},{justOne: true},(err)=>{return err});
};

exports.updateCollExpiration = (oldBarcode, oldDate, oldQuantity, newBarcode, newDate, newQuantity) => {
    this.createCollExpiration(newBarcode, newDate, newQuantity);
    this.deleteCollExpiration(oldBarcode, oldDate, oldQuantity);
};