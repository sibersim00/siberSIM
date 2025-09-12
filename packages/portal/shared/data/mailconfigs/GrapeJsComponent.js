import React, { useEffect } from "react";
import grapesjs from "grapesjs";
import newsletterPlugin from "grapesjs-preset-newsletter";
import styled from "styled-components";
import "grapesjs/dist/css/grapes.min.css";

const Wrapper = styled.div`
  height: 500px !important;
  border: 5px solid #444;
`;

const EmailTemplateBuilder = (props) => {
  const { initialHtml, setInitialHtml } = props;

  useEffect(() => {
    // Set up GrapesJS editor with the Newsletter plugin

    const editor = grapesjs.init({
      height: "100%",
      exportWrapper: true,
      // storageManager: {
      //   autoload: 0
      // },
      assetManager: {
        assets: "",
        autoAdd: 1,
        headers: {},
        handleAdd: () => {
          alert("this feature is disabled");
        },
        showUrlInput: false,
      },
      richTextEditor: {},
      container: "#gjs",
      components: initialHtml,
      plugins: [newsletterPlugin],
      pluginsOpts: {
        "gjs-preset-newsletter": {
          modalTitleImport: "Import Template",
          modalLabelImport: "Paste all your code here below and click import",
          modalLabelExport: "Copy the code and use it wherever you want",
          modalBtnImport: "Import Template",
          codeViewerTheme: "material",
          cellStyle: {
            "font-size": "12px",
            "font-weight": 300,
            "vertical-align": "top",
            color: "rgb(111, 119, 125)",
            margin: 0,
            padding: 0,
          },
        },
      },
      storageManager: {
        type: "remote",
        autoload: true,
        stepsBeforeSave: 1,
        contentTypeJson: true,
        urlStore:
          "https://baconipsum.com/api/?type=all-meat&paras=3&start-with-lorem=1&format=html",
        urlLoad:
          "https://baconipsum.com/api/?type=all-meat&paras=3&start-with-lorem=1&format=html",
        // For custom parameters/headers on requests
        params: {
          _some_token: "CST",
          "Access-Control-Allow-Origin": "http://localhost:8080",
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic ...",
        },
        json_encode: {
          "gjs-components": [],
          "gjs-style": [],
        },
      },
      showDevices: false,
    });
    const styleManager = editor.StyleManager;
    const fontProperty = styleManager.getProperty("typography", "font-family");

    fontProperty.addOption({ value: "sans-serif", name: "sans-serif" });
    styleManager.render();

    // grab the instance of the rich text editor =>
    const rte = editor.RichTextEditor;

    // we don't like the stock behavior of the link button in the built-in RTE
    rte.remove("link");

    // A simple way to change font-size from the rich text editor...
    rte.add("fontSize", {
      attributes: {
        title: "font size",
      },
      icon: `<select class="gjs-field">
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
        <option value="7">7</option>
      </select><div>&nbsp;&nbsp;Text Size</div>`,
      // Bind the 'result' on 'change' listener
      event: "change",
      result: (rte, action) =>
        rte.exec("fontSize", action.btn.firstChild.value),
      // Callback on any input change (mousedown, keydown, etc..)
      update: (rte, action) => {
        const value = rte.doc.queryCommandValue(action.name);
        if (value !== "false") {
          // value is a string
          action.btn.firstChild.value = value;
        }
      },
    });
    // example of manipulating the elements...

    editor.on("component:selected", () => {
      const theHtml = editor.getHtml();
      const el = document.createElement("span");
      const theCss = editor.getCss();
      // console.log(theHtml, "theHtml");

      // Combine HTML and CSS
      const combinedCode = `<style>${theCss}</style>${theHtml}`;
      setInitialHtml(combinedCode);

      // convert to js object so we can work with it easier
      el.innerHTML = theHtml;
    });
  }, [initialHtml]);

  return (
    <div className="App">
      <Wrapper>
        <div id="gjs"></div>
      </Wrapper>
    </div>
  );
};

export default EmailTemplateBuilder;
