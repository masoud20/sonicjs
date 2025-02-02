var dataService = require("../../../services/data.service");
var emitterService = require("../../../services/emitter.service");
var globalService = require("../../../services/global.service");

var axios = require("axios");
var axiosInstance;

const SibApiV3Sdk = require("sib-api-v3-sdk");
const sendInBlueApiKey = process.env.SENDINBLUE_API_KEY;

module.exports = appAnalyticsMainService = {
  startup: async function (app) {
    emitterService.on("beginProcessModuleShortCode", async function (options) {
      if (options.shortcode.name === "APP-ANALYTICS") {
        options.moduleName = "app-analytics";
        await moduleService.processModuleInColumn(options);
      }
    });

    // emitterService.on("postPageRender", async function (options) {
    //   appAnalyticsMainService.trackEventSend({
    //     eventName: "page_load",
    //     url: options.page.data.url,
    //   });
    // });

    // emitterService.on("postAdminPageRender", async function (options) {
    //   appAnalyticsMainService.trackEventSend({
    //     eventName: "admin_page_load",
    //     url: options.req.url,
    //   });
    // });

    emitterService.on("firstPageLoaded", async function (options) {
      let pageCount = await dataService.getContentByType("page", 0);
      appAnalyticsMainService.trackEventSend({
        eventName: "startup",
        pageCount: pageCount.length,
        siteDomain: options.req.hostname
      });
    });

    if (process.env.ANALYTICS_RECEIVE_URL) {
      if (app) {
        app.post(process.env.ANALYTICS_RECEIVE_URL, async function (req, res) {
          //HACK: this is causing prod app to crash, bypass for now
          appAnalyticsMainService.processEvent(req.body, req.ip);
          res.json({ ok: "ok" });
        });
      }
    }
  },

  trackEventSend: async function (data) {
    if (await appAnalyticsMainService.trackingEnabled()) {
      const installFile = await appAnalyticsMainService.getEventMeta();

      data.installId = installFile.installId;
      data.websiteTitle = installFile.websiteTitle
        ? installFile.websiteTitle
        : "";
      data.agreeToFeedback = installFile.agreeToFeedback
        ? installFile.agreeToFeedback
        : "";
      data.email = installFile.agreeToFeedback ? installFile.email : "";

      let axios = await appAnalyticsMainService.getAxios();
      let url = process.env.ANALYTICS_POST_URL
        ? process.env.ANALYTICS_POST_URL
        : "https://sonicjs.com/sonicjs-app-analytics";
        try {
          let result = axios.post(url, data);
        } catch (error) {
          
        }
    }
  },

  getEventMeta: async function () {
    const installFile = require("../../../data/config/installId.json");
    return installFile;
  },

  getLocation: async function (ipAddress) {
    let token = process.env.IPINFO_TOKEN;
    let result = await axios.get(
      `https://ipinfo.io/${ipAddress}?token=${token}`
    );
    return result.data;
  },

  processEvent: async function (data, ipAddress) {
    let profileUrl = `/analytics/${data.installId}`;
    let profile = await dataService.getContentByUrl(profileUrl);
    let timeStamp = new Date().toISOString();

    console.log(`processing event for ${data.installId} - ${data.websiteTitle}`)

    if (!profile || profile.data.status === "Not Found") {

      await appAnalyticsMainService.addEmailToList(data);

      let payload = {
        data: {
          contentType: "app-analytics",
          title: "app-analytics",
          url: profileUrl,
          installId: data.installId,
          siteDomain: data.siteDomain,
          firstSeenOn: timeStamp,
          events: [],
          pageCount: 0,
          pageVisits: 0,
          adminPageVisits: 0,
          bootCount: 1,
        },
      };
      // TODO: troubleshoot
      // payload.location = await appAnalyticsMainService.getLocation(ipAddress);
      profile = await dataService.contentCreate(payload, false, 0);
    }

    if (profile && profile.data && profile.data.events) {
      if (data.eventName == "startup") {
        //only on startup get page counts, boot counts, etc
        profile.data.pageCount = data.pageCount;
        //TODO

        // IP Lookup

        profile.data.events.push({
          name: data.eventName,
          timeStamp: timeStamp,
        });
      }

      if (data.eventName === "page_load") {
        profile.data.events.push({
          name: data.eventName,
          timeStamp: timeStamp,
          url: data.url,
        });

        profile.data.pageVisits += 1;
      }

      if (data.eventName === "admin_page_load") {
        profile.data.events.push({
          name: data.eventName,
          timeStamp: timeStamp,
          url: data.url,
        });

        profile.data.adminPageVisits += 1;
      }

      profile.data.websiteTitle = data.websiteTitle;
      profile.data.emailOptin = data.agreeToFeedback;
      profile.data.email = data.email;
      profile.data.lastSeenOn = timeStamp;

      profile = await dataService.editInstance(profile, 0);
    }
  },

  addEmailToList: async function (data) {

    console.log('adding to email list', data);

    if (data.agreeToFeedback) {
      let defaultClient = SibApiV3Sdk.ApiClient.instance;

      let apiKey = defaultClient.authentications["api-key"];
      apiKey.apiKey = sendInBlueApiKey;

      let apiInstance = new SibApiV3Sdk.ContactsApi();

      let createContact = new SibApiV3Sdk.CreateContact();
      
      createContact.email = data.email;
      createContact.listIds = [5]
      
      apiInstance.createContact(createContact).then(function(data) {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
      }, function(error) {
        console.error(error);
      });
    }
  },

  getEmail: async function (req) {
    if (req.user && req.user.username) {
      return req.user.username;
    }
  },

  trackingEnabled: async function (host) {
    if (
      process.env.LOCAL_ANALYTICS &&
      process.env.LOCAL_ANALYTICS.toLowerCase() === "false"
    ) {
      return false;
    }

    if (
      process.env.LOCAL_ANALYTICS &&
      process.env.LOCAL_ANALYTICS.toLowerCase() === "true"
    ) {
      return true;
    }

    if (process.env.LOCAL_DEV === "true") {
      return true;
    }
    return false;
  },

  getAxios: async function () {
    if (!appAnalyticsMainService.axiosInstance) {
      const defaultOptions = {
        headers: {},
        baseURL: globalService.baseUrl,
      };

      appAnalyticsMainService.axiosInstance = axios.create(defaultOptions);
    }
    return appAnalyticsMainService.axiosInstance;
  },
};
