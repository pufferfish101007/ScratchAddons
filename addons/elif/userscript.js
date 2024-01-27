export default async function ({ addon, msg, global, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;
  ScratchBlocks.Blocks["control_if_elif_else"] = {
    init: function() {
      this.jsonInit({
        "type": "control_if_else",
        "message0": ScratchBlocks.Msg.CONTROL_IF,
        "message1": "%1",
        "message2": "else if %1 then",
        "message3": "%1",
        "message4": ScratchBlocks.Msg.CONTROL_ELSE,
        "message5": "%1",
        "args0": [
          {
            "type": "input_value",
            "name": "CONDITION",
            "check": "Boolean"
          }
        ],
        "args1": [
          {
            "type": "input_statement",
            "name": "SUBSTACK"
          }
        ],
        "args2": [
          {
            "type": "input_value",
            "name": "CONDITION2",
            "check": "Boolean"
          }
        ],
        "args3": [
          {
            "type": "input_statement",
            "name": "SUBSTACK2"
          }
        ],
        "args5": [
          {
            "type": "input_statement",
            "name": "SUBSTACK3"
          }
        ],
        "category": ScratchBlocks.Categories.control,
        "extensions": ["colours_control", "shape_statement"]
      });
    }
  };
  if (!addon.tab.redux.state) return console.warn("Redux is not available!");
  addon.tab.redux.initialize();

  const UPDATE_TOOLBOX_ACTION = "scratch-gui/toolbox/UPDATE_TOOLBOX";

  const xmlParser = new DOMParser();
  const xmlSerializer = new XMLSerializer();

  function encodeXML(string) {
    return string
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  const reduxStateListener = async (e) => {
    if (e.detail.action.type === UPDATE_TOOLBOX_ACTION && !e.detail.action.saExtraBlocks) {
      const toolboxXML = xmlParser.parseFromString(e.detail.action.toolboxXML, "text/xml");

      const insertAfter = (referenceBlockOpcode, seperator, ...newBlocks) => {
        const referenceBlock = toolboxXML.querySelectorAll(`[type="${referenceBlockOpcode}"`)[0];

        const newBlockXMLs = [];
        if (seperator) {
          const seperatorXML = toolboxXML.createElement("sep");
          seperatorXML.setAttribute("gap", 36);
          newBlockXMLs.push(seperatorXML);
        }
        for (const newBlock of newBlocks) {
          const newBlockXML = toolboxXML.createElement("block");
          newBlockXML.setAttribute("type", newBlock.type);
          if (newBlock.innerHTML) newBlockXML.innerHTML = newBlock.innerHTML;
          newBlockXMLs.push(newBlockXML);
        }

        referenceBlock.after(...newBlockXMLs);
      };

      let defaultVariableName = "my variable";
      if (vm.editingTarget) {
        let variableIDs = Object.keys(vm.editingTarget.variables);
        if (variableIDs.length !== 0) {
          defaultVariableName = vm.editingTarget.variables[variableIDs[0]].name;
        } else {
          const stage = vm.runtime.getTargetForStage();
          if (stage) {
            variableIDs = Object.keys(stage.variables);
            if (variableIDs.length !== 0) {
              defaultVariableName = stage.variables[variableIDs[0]].name;
            }
          }
        }
      }

      insertAfter(
        "control_if_else",
        false,
        { type: "control_if_elif_else" },
      );

      addon.tab.redux.dispatch({
        type: UPDATE_TOOLBOX_ACTION,
        toolboxXML: xmlSerializer.serializeToString(toolboxXML),
        saExtraBlocks: true,
      });
    }
  };

  const updateToolbox = () => {
    if (vm.editingTarget) {
      vm.emitWorkspaceUpdate();
    }
  };
  
  const blockRender = ScratchBlocks.BlockSvg.prototype.render;
  ScratchBlocks.BlockSvg.prototype.render = function (...args) {
    if (this.type === "control_if_elif_else") {
      console.log('elif', this)
    }
    if (!addon.self.disabled
      && this.type === "control_if_else"
      && this.inputList[4].connection?.targetConnection?.sourceBlock_?.type === "control_if_else"
      && !this.inputList[4].connection?.targetConnection?.sourceBlock_?.nextConnectiom?.targetConnection
    ) {
      const fixupCon = (con, target) => {
        con.sourceBlock_ = target;
        if (con.targetConnection) con.targetConnection.sourceBlock_.parentBlock_ = target;
      }
      console.log(this)
      let input4 = this.inputList[4];
      let input3 = this.inputList[3]
      let nextIfElse = input4.connection?.targetConnection?.sourceBlock_;
      this.type = "control_if_elif_else";
      // inputs were: if <>, then, {}, else,       {}
      // inputs are:  if <>, then, {}, else if <>, then, {}, else, {}
      const cond2 = nextIfElse.inputList[0];
      cond2.fieldRow[0].text_ = "else if";
      cond2.sourceBlock_ = this;
      fixupCon(cond2.connection, this);
      this.inputList[3] = cond2;
      this.inputList[4] = new ScratchBlocks.Input(5, "", this).appendField("then");
      const stack2con = nextIfElse.inputList[2].connection;
      fixupCon(stack2con, this);
      this.inputList.push(new ScratchBlocks.Input(3, "SUBSTACK2", this, stack2con));
      this.inputList.push(new ScratchBlocks.Input(5, "", this).appendField("else"));
      const stack3con = nextIfElse.inputList[2].connection;
      fixupCon(stack3con, this);
      this.inputList.push(new ScratchBlocks.Input(3, "SUBSTACK3", this, stack3con));
      console.log(this)
      blockRender.call(this, ...args);
      // restore inputs to original state
      this.inputList.splice(5, 3);
      this.inputList[4] = input4;
      this.inputList[3] = input3;
      cond2.fieldRow[0].text_ = "if";
      cond2.sourceBlock_ = nextIfElse;
      fixupCon(cond2.connection, nextIfElse);
      fixupCon(stack2con, nextIfElse);
      fixupCon(stack3con, nextIfElse);
      this.type = "control_if_else";
      return;
    }
    return blockRender.call(this, ...args);
  };
  
  const transformTargetToSa = (target) => {
    return
    if (target.saElifTransformed) return;
    const blocks = target.blocks;
    console.log(blocks)
    for (const block of Object.values(blocks._blocks)) {
      let ifElse2;
      if (block.opcode === "control_if_else" && (ifElse2 = blocks._blocks[block.inputs["SUBSTACK2"].block])?.opcode === "control_if_else" && ifElse2.next === null) {
        console.log('if elif else')
        let substack2 = Object.assign({}, blocks._blocks[ifElse2.id].inputs["SUBSTACK"]);
        let substack3 = Object.assign({}, blocks._blocks[ifElse2.id].inputs["SUBSTACK2"]);
        ifElse2.inputs["SUBSTACK"] = {};
        ifElse2.inputs["SUBSTACK2"] = {};
        blocks.deleteBlock(ifElse2.id);
        block.opcode = "control_if_elif_else";
        block.inputs["SUBSTACK2"] = substack2;
        block.inputs["SUBSTACK3"] = substack3;
      }
    }
    target.saElifTransformed = true;
    vm.emitWorkspaceUpdate();
  };
  const onEnabled = () => {
    addon.tab.redux.addEventListener("statechanged", reduxStateListener);
    updateToolbox();
    if (vm.editingTarget) {
      transformTargetToSa(vm.editingTarget);
    }
  };

  onEnabled();
  
  await new Promise((resolve) => {
    if (addon.tab.traps.vm.editingTarget) return resolve();
    addon.tab.traps.vm.runtime.once("PROJECT_LOADED", resolve);
  });
  if (vm.editingTarget) {
      transformTargetToSa(vm.editingTarget);
    }
  
  const oldSetEditingTarget = vm.runtime.constructor.prototype.oldSetEditingTarget;
  vm.runtime.constructor.prototype.oldSetEditingTarget = function (target) {
    transformTargetToSa(target);
    oldSetEditingTarget.call(this, target);
  }

  //addon.settings.addEventListener("change", updateToolbox);

  addon.self.addEventListener("disabled", () => {
    addon.tab.redux.removeEventListener("statechanged", reduxStateListener);
    updateToolbox();
  });

  addon.self.addEventListener("reenabled", onEnabled);
};
