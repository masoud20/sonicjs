/* user module for loggedin users */
var sessionID;
var axiosInstance;

$(document).ready(async function () {
  setupSessionID();
  await setupAxiosInstance();
});

async function setupAxiosInstance() {
  let baseUrl = window.location.protocol + "//" + window.location.host + "/";
  let token = $("#token").val();

  const defaultOptions = {
    headers: {
      Authorization: `${token}`,
    },
    baseUrl: baseUrl,
  };

  axiosInstance = axios.create(defaultOptions);
}

function setupSessionID() {
  sessionID = $("#sessionID").val();
}

//TODO, make this just refresh the body content with a full get
function fullPageUpdate(url = undefined) {
  // debugger;
  console.log("refreshing page url", url);
  if (url) {
    window.location.replace(url);
  } else {
    location.reload();
  }
}

async function openFormInModal(action, contentType, id, options) {
  await openDetailForm(action, id);
  await openEditForm(action, id);
  await openDeleteForm(action, id);
  await openCreateForm(action, contentType, options);
}

async function openDetailForm(action, id) {
  if (action === "detail") {
    let content = await dataService.getContentById(id);
    let form = await dataService.formGet(
      content.contentTypeId,
      content,
      "await submitContent(submission);",
      undefined,
      undefined,
      $("#sessionID").val(),
      window.location.pathname,
      false,
      undefined,
      true
    );

    $("#genericModal .modal-title").text(
      helperService.titleCase(`${content.contentTypeId} ${action}`)
    );

    $("#formio").empty();
    $("#formio").html(form.html);

    loadModuleSettingForm();

    $("#genericModal").appendTo("body").modal("show");
  }
}

async function openEditForm(action, id) {
  if (action === "edit") {
    let content = await dataService.getContentById(id);
    let form = await dataService.formGet(
      content.contentTypeId,
      content,
      "await submitContent(submission);",
      undefined,
      undefined,
      $("#sessionID").val(),
      window.location.pathname
    );

    $("#genericModal .modal-title").text(
      helperService.titleCase(`${action} ${content.contentTypeId}`)
    );

    $("#formio").empty();
    $("#formio").html(form.html);

    loadModuleSettingForm();

    $('input[name="data[title]"').focus();

    $("#genericModal").appendTo("body").modal("show");
  }
}

async function openDeleteForm(action, id) {
  if (action === "delete") {
    let content = await dataService.getContentById(id);
    let form = JSON.stringify(content.data, null, 4);

    form += `<div><button class="mt-2 btn btn-danger" type="button"  onclick="return confirmDelete('${content.id}', 1)""><i class="bi bi-trash"></i> Confirm Delete</button></div>`;

    $("#genericModal .modal-title").text(
      helperService.titleCase(`${action} ${content.contentTypeId}`)
    );

    $("#formio").empty();
    $("#formio").html(form);

    $("#genericModal").appendTo("body").modal("show");
  }
}

async function confirmDelete(id) {
  dataService.contentDelete(id, $("#sessionID").val()).then((response) => {
    fullPageUpdate();
  });
}

async function openCreateForm(action, contentType, options) {
  if (action === "create") {
    let form = await dataService.formGet(
      contentType,
      undefined,
      "await submitContent(submission);",
      undefined,
      undefined,
      $("#sessionID").val(),
      window.location.pathname,
      false,
      options && options.defaults ? options.defaults : [],
      false
    );

    // debugger;
    // let moduleTitle = form.contentType.data.modalSettings?.modalTitle ?? helperService.titleCase(`${action} ${contentType}`);
    let moduleTitle = form.contentType.data.states?.moduleTitle ?? helperService.titleCase(`${action} ${contentType}`);

    $("#genericModal .modal-title").text(
      helperService.titleCase(`New ${contentType}`)
    );
    $("#formio").empty();
    $("#formio").html(form.html);

    loadModuleSettingForm();

    $('input[name="data[title]"').focus();

    $("#genericModal").appendTo("body").modal("show");
  }
}

async function submitContent(
  submission,
  refresh = true,
  contentType = "content",
  ignoreSuccessAction = false
) {
  // debugger;
  console.log("Submission was made!", submission);
  let entity = submission.data ? submission.data : submission;
  entity.contentType = entity.contentType ?? contentType;

  if (typeof formIsDirty !== "undefined") {
    formIsDirty = false;
  }

  let result = await axios({
    method: "post",
    url: "/form-submission",
    data: {
      data: entity,
      url: window.location.pathname,
    },
  });

  // debugger;
  if (!ignoreSuccessAction) {
    eval(result.data.successAction);
  }

  // if (!contentType.startsWith("user")) {
  //   if (submission.id || submission.data.id) {
  //     await editInstance(entity, refresh, contentType);
  //   } else {
  //     await createInstance(entity, true, contentType);
  //   }
  // } else {
  //   entity.contentType = contentType;

  //   let result = await axios({
  //     method: "post",
  //     url: "/form-submission",
  //     data: {
  //       data: entity,
  //     },
  //   });
  // fullPageUpdate();
  // }
}

async function editInstance(
  payload,
  refresh,
  contentType = "content",
  growlMessage
) {
  if (contentType === "user") {
    contentType = "users";
  }
  await dataService
    .editInstance(payload, sessionID)
    .then(async function (response) {
      // debugger;
      console.log("editInstance -->", response);
      removeDirty();
      // resolve(response.data);
      // return await response.data;
      if (response.contentTypeId === "page" && !globalService.isBackEnd()) {
        if (response.url) {
          window.location.href = response.url;
        } else {
          fullPageUpdate();
        }
      } else if (growlMessage) {
        addGrowl(growlMessage);
      } else if (refresh) {
        fullPageUpdate();
      }
    })
    .catch(function (error) {
      console.log("editInstance", error);
    });
}

function removeDirty(){
  $(".submit-alert").remove();
  if (typeof formIsDirty !== "undefined") {
    formIsDirty = false;
  }
}

async function createInstance(
  payload,
  refresh = false,
  contentType = "content"
) {
  // console.log('createInstance payload', payload);
  // let content = {};
  // content.data = payload;
  // this.processContentFields(payload, content);
  // debugger;
  console.log("payload", payload);
  if (payload.id || "id" in payload) {
    delete payload.id;
  }

  if (!payload.data) {
    let temp = { data: payload };
    payload = temp;
  }

  if (contentType === "Roles") {
    payload = payload.data;
  }

  // debugger;
  let entity = await dataService.contentCreate(payload);

  if (entity && entity.contentTypeId === "page") {
    let isBackEnd = globalService.isBackEnd();
    if (isBackEnd) {
      window.location.href = `/admin/content/edit/page/${entity.id}`;
    } else {
      window.location.href = payload.data.url;
    }
  } else if (refresh) {
    fullPageUpdate();
  }

  return entity;
}

function postSubmissionSuccessMessage(message) {
  let form = `<div>
  ${message}
  </div>
  <button class="btn btn-success mt-5" type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
    <span aria-hidden="true">Ok</span>
  </button>`;
  $("#formio").empty();
  $("#formio").html(form);
}

function redirectToUrl(url) {
  window.location.href = url;
}

function addGrowl(message) {
  $.bootstrapGrowl(message, {
    ele: "body", // which element to append to
    type: "info", // (null, 'info', 'danger', 'success')
    offset: { from: "bottom", amount: 20 }, // 'top', or 'bottom'
    align: "right", // ('left', 'right', or 'center')
    width: 250, // (integer, or 'auto')
    delay: 3000, // Time while the message will be displayed. It's not equivalent to the *demo* timeOut!
    allow_dismiss: false, // If true then will display a cross to close the popup.
    stackup_spacing: 10, // spacing between consecutively stacked growls.
  });
}
