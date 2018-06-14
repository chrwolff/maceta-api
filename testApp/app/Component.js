sap.ui.define(["sap/ui/core/UIComponent"], function(UIComponent) {
  "use strict";

  return UIComponent.extend("test.Component", {
    metadata: {
      manifest: "json"
    },

    init: function() {
      UIComponent.prototype.init.apply(this, arguments);
    },

    createContent: function() {
      const button = new sap.m.Button({ text: "add", press: addItem });
      const timeline = new sap.suite.ui.commons.Timeline("timeline");
      timeline.bindAggregation("content", {
        path: "data>/Posts",
        factory: timelineItemFactory
      });
      const page = new sap.m.Page({
        title: "{i18n>pageTitle}",
        content: [button, timeline]
      });
      const app = new sap.m.App({
        pages: page
      });

      return app;
    }
  });

  function addItem() {
    const timeline = sap.ui.getCore().byId("timeline");
    const binding = timeline.getBinding("content");
    const context = binding.create({
      userName: "Johnny",
      text: "Hello World"
    });
    context.created().then(() => binding.refresh());
  }

  function timelineItemFactory(id, context) {
    return new sap.suite.ui.commons.TimelineItem({
      userName: "{data>userName}",
      text: "{data>text}",
      dateTime: {
        path: "data>time",
        formatter: hammertime => new Date(hammertime)
      }
    });
  }
});
