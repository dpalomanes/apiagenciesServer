var express = require('express');
var request = require('axios');
var router = express.Router();
var fs = require('fs');



router.get('/getsites', function(req, res) {

    request.get('https://api.mercadolibre.com/sites')
        .then(response => {
            var data = response.data.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));

            res.send(data);
        })
        .catch(error => {
            res.send(error)
        });

});

router.get('/getsites/:id', function(req, res) {

    var site = req.params.id

    request.get('https://api.mercadolibre.com/sites/' + site + "/payment_methods")
        .then(response => {
            var data = response.data.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));

            var data2 = data.filter(v => v.payment_type_id == 'ticket');

            res.send(data2);
        })
        .catch(error => {
            res.send(error)
        });

});

router.get('/getagencies/:id/:payment_method/:latitude/:longitude/:radius/:sorting?', function(req, res) {

    var site = req.params.id
    var paymentMethod = req.params.payment_method
    var latitude = req.params.latitude
    var longitude = req.params.longitude
    var radius = req.params.radius
    var sort = req.params.sorting


    var url = 'https://api.mercadolibre.com/sites/' + site
        + "/payment_methods/" + paymentMethod
        + "/agencies?near_to="
        + latitude + "," + longitude + "," + radius


    request.get(url)
        .then(response => {
            var data = response.data.results;
            
            var data2 = []
            for (i in data){
                var obj = {
                    agency_code:data[i].agency_code,
                    description:data[i].description,
                    address_line:data[i].address.address_line,
                    city:data[i].address.city,
                    distance: parseInt(data[i].distance)
                }
                data2.push(obj)
            }



            if (sort === "address_line"){
                data2 = data2.sort((a,b) => (a.address_line > b.address_line) ? 1 : ((b.address_line > a.address_line) ? -1 : 0));
                res.send(data2);
            } else if (sort === "agency_code"){
                data2 = data2.sort(function(a, b) {
                    return a.agency_code - b.agency_code;
                });
                res.send(data2);
            } else {
                res.send(data2);
            }
        })
        .catch(error => {
            res.send(error)
        });

});

router.post('/favorites/write', function(req, res) {

    try {

        var agency = JSON.parse(req.body.data)
        var agencies = []
        var index = -1

        if(fs.existsSync('agencies.json')){
            var rawdata = fs.readFileSync('agencies.json');
            agencies = JSON.parse(rawdata);
        }

        for (i=0; i < agencies.length ; i++){
            if(agencies[i].agency_code == agency.agency_code){
                index = i
            }
        }

        if (index == -1){
            agencies.push(agency)

            fs.writeFileSync('agencies.json', JSON.stringify(agencies));

            res.sendStatus(201)
        } else {
            res.sendStatus(200)
        }
    } catch (error){
        res.sendStatus(500)
    }

});

router.delete('/favorites/remove/:id', function(req, res) {

    var agencyCode = req.params.id
    try {
        var agencies = []
        var index = -1

        if(fs.existsSync('agencies.json')){
            var rawdata = fs.readFileSync('agencies.json');
            agencies = JSON.parse(rawdata);
        }

        for (i=0; i < agencies.length ; i++){
            if(agencies[i].agency_code == agencyCode){
                index = i
            }
        }

        if(index != -1){
            agencies.splice(index,1)
            fs.writeFileSync('agencies.json', JSON.stringify(agencies));
            res.sendStatus(200)
        } else {
            res.sendStatus(204)
        }
    } catch (error){
        res.send(error)
    }
});

router.get('/favorites/read', function(req, res) {
    var agencies = [];
    if(fs.existsSync('agencies.json')){
        var rawdata = fs.readFileSync('agencies.json');
        agencies = JSON.parse(rawdata);
    }
    agencies = agencies.sort(function(a, b) {
        return a.agency_code - b.agency_code;
    });
    res.send(JSON.stringify(agencies));
});



module.exports = router;