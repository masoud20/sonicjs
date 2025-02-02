/**
 * Test Service -
 * The test service is contains utilities that accomadate Cypress end to end testing
 * @module testService
 */

const dalService = require("./dal.service");
const moduleService = require("./module.service");

const cypressTestCleanupTag = 'cypress-test-cleanup-tag'

module.exports = testService = {
  startup: async function (app) {


    app.get("/clear-test-data", async function (req, res) {
      let result = await testService.cleanTestData();
      res.send({deleteCount: result });
    });

    app.get("/set-e2e-test-mode", async function (req, res) {
      console.log('setting E2E_TEST_MODE to true')
      process.env.E2E_TEST_MODE = true;
      res.sendStatus(200);
    });

    app.get("/set-e2e-test-mode-off", async function (req, res) {
      console.log('setting E2E_TEST_MODE to false')
      process.env.E2E_TEST_MODE = false;
      res.sendStatus(200);
    });
  },

  cleanTestData: async function () {
   await dalService.contentDeleteTestData(cypressTestCleanupTag);
   console.log('deleting test modules')
   await moduleService.deleteModule('aa-cypress-module-content-type')
   await moduleService.deleteModule('aa-cypress-module')

  },

};
