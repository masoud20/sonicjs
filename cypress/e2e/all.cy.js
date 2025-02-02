import "./backend/content.cy";
import "./backend/content_type.cy";
import "./backend/load-admin-pages.cy";
import "./backend/login-expiration.cy";
import "./backend/login-logout.cy";
import "./backend/module.cy";
import "./backend/role.cy";
import "./backend/user.cy";
import "./front-end/group.cy";
import "./front-end/group-details.cy";
import "./page-builder/page.cy";

after(() => {
  cy.SonicJs.clearCypressTesFlag();
  cy.SonicJs.clearCypressTestData();
});
