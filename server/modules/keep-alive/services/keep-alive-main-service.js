var dataService = require('../../../services/data.service');
var emitterService = require('../../../services/emitter.service');
var globalService = require('../../../services/global.service');
var viewService = require('../../../services/view.service');
var https = require("https");


module.exports = keepAliveMainService = {

    startup: async function () {
        // emitterService.on('modulesLoaded', async function () {

        //     setInterval(function () {
        //         https.get('https://sonicjs.herokuapp.com/');
        //         // console.log('keep alive' + globalService.getBaseUrl());
        //     }, 300000); // every 5 minutes (300000)

        // });
    },

    // processView: async function (contentType, viewModel, viewPath) {
    //     var result = await viewService.getProcessedView(contentType, viewModel, viewPath);

    //     return result;
    // }

}
