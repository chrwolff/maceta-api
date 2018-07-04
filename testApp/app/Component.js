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
      const timeline = new sap.suite.ui.commons.Timeline("timeline");
      timeline.bindAggregation("content", {
        path: "data>/Posts",
        factory: timelineItemFactory
      });
      const page = new sap.m.Page({
        title: "{i18n>pageTitle}",
        content: timeline
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
      },
      embeddedControl: new sap.m.VBox({
        items: [
          new sap.m.Input({
            value: "{data>userName}",
            visible: "{data>isTemplate}",
            placeholder: "{i18n>newReviewUserNameHint}"
          }),
          new sap.m.TextArea({
            value: "{data>text}",
            growing: true,
            width: "100%",
            editable: "{data>isTemplate}",
            placeholder: "{i18n>newReviewUserCommentHint}",
            valueLiveUpdate: true
          }),
          new sap.m.Button({
            visible: "{data>isTemplate}",
            text: "{i18n>newReviewButtonText}",
            press: () => null
          })
        ]
      })
    });
  }
});
