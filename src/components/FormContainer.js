import React, { Component } from "react";
import Dexie from "dexie";
import db from "../dixie";

import MainInput from "./formComponents/MainInput";
import SubInput from "./formComponents/SubInput";

export default class FormContainer extends Component {
    constructor(props){
        super(props);
        this.state = {
            structure: [],
            newInput: {
              text: "",
              select: "",
              firstConditionFieldValue: "",
              secondConditionFieldValue: ""
            }
          };

          this.promise = db.structures
          .toArray()
          .then(response => {
            return response;
          })
          .then(state => {
            const flatState = this.transformToFlatStructure(state);
            this.setState({ structure: flatState });
          });
    }




  componentDidMount() {
    
  }

  transformToFlatStructure(array) {
    let result = [];

    array.forEach(obj => {
      result.push(obj);
      if (Array.isArray(obj.children)) {
        result = result.concat(this.transformToFlatStructure(obj.children));
      }
    });
    return result;
  }

  addDepth(arr, depth = 0) {
    arr.forEach(obj => {
      obj.depth = depth;
      this.addDepth(obj.children, depth + 1);
    });
  }

  transformToTree(array) {
    let map = {},
      node,
      result = [];

    for (let i = 0; i < array.length; i++) {
      map[array[i].id] = i;
      array[i].children = [];
    }

    for (let i = 0; i < array.length; i++) {
      node = array[i];
      if (node.parentId !== "0") {
        if (array[map[node.parentId]]) {
          array[map[node.parentId]].children.push(node);
        }
      } else {
        result.push(node);
      }
    }
    return result;
  }

  generateNewId() {
    let idsArray = [];

    for (let i = 0; i < this.state.structure.length; i++) {
      idsArray.push(parseInt(this.state.structure[i].id));
    }
    return (Math.max(...idsArray) + 1).toLocaleString();
  }

  updateDB() {
    const n = 0;

    Dexie.spawn(function*() {
      yield db.structures
        .where("id")
        .above(n.toLocaleString())
        .delete();
    }).catch(err => {
      console.error("Deleting from db failed" + err.stack);
    });

    let inputs = this.transformToTree(this.state.structure);

    this.addDepth(inputs);

    Dexie.spawn(function*() {
      yield db.structures.bulkPut(inputs);
      console.log(inputs);
    }).catch(err => {
      console.error("Ooops" + err.stack);
    });
  }

  handleAddMainInput(e) {
    e.preventDefault();
    let inputs = this.state.structure;
    let newInput;

    inputs.forEach(obj => {
      obj.class = null;
    });

    if (inputs.length > 0) {
      newInput = {
        id: this.generateNewId(),
        parentId: "0",
        type: "main",
        class: "empty"
      };
    } else
      newInput = {
        id: "1",
        parentId: "0",
        type: "main",
        class: "empty"
      };

    inputs.push(newInput);

    this.setState({ structure: inputs }, this.updateDB);
  }

  handleAddSubInput(
    i,
    question,
    type,
    firstConditionField,
    secondConditionField
  ) {
    let inputs = this.state.structure;
    const parentInputId = inputs[i].id;

    inputs.forEach(obj => {
        obj.class = "null";
      });

    const subInputStructure = {
      id: this.generateNewId(),
      parentId: parentInputId.toLocaleString(),
      type: "sub",
      class: "empty",
      firstConditionField: '',
      secondConditionField: ''
    };

    const newStructure = inputs
      .slice(0, i + 1)
      .concat(subInputStructure, this.state.structure.slice(i + 1));

    newStructure[i].question = question;
    newStructure[i].conditionType = type;
    if (firstConditionField) {
      newStructure[i].firstConditionField = firstConditionField;
    }
    if (secondConditionField) {
      newStructure[i].secondConditionField = secondConditionField;
    }

    this.setState(
      {
        structure: newStructure,
        newInput: {
          text: question,
          select: type,
          firstConditionFieldValue: firstConditionField,
          secondConditionFieldValue: secondConditionField
        }
      },
      this.updateDB
    );
  }

  handleDeleteInput(i) {
    const start = i;
    let inputs = this.state.structure;
    let inputId = inputs[i].id;

    inputs.splice(i, 1);

    for (let i = start; i < inputs.length; i++) {
      if (inputs[i]) {
        if (inputs[i].parentId === inputId) {
          inputId = inputs[i].id;
          inputs.splice(i, 1);
          i--;
        }
      }
    }

    let numberOfMainInputs = 0;

    inputs.forEach(obj => {
      if (obj.type === "main") numberOfMainInputs++;
    });
    if (numberOfMainInputs === 0) inputs = [];

    this.setState({ structure: inputs }, this.updateDB);
  }

  render() {
    const inputs = this.state.structure.map((obj, i) => {
      const margin = (obj.depth + 1) * 30 + "px";
      if (obj.type === "sub")
        return (
          <SubInput
            handleAddSubInput={(
              e,
              question,
              type,
              firstConditionField,
              secondConditionField
            ) =>
              this.handleAddSubInput(
                e,
                question,
                type,
                firstConditionField,
                secondConditionField
              )
            }
            handleDelete={e => this.handleDeleteInput(e)}
            input={this.state.newInput}
            index={i}
            margin={margin}
            class={obj.class}
            question={obj.question}
            type={obj.conditionType}
            firstConditionField={obj.firstConditionField}
            secondConditionField={obj.secondConditionField}
            key={i}
          />
        );
      else
        return (
          <MainInput
            handleAddSubInput={(e, question, type) =>
              this.handleAddSubInput(e, question, type)
            }
            handleDelete={e => this.handleDeleteInput(e)}
            index={i}
            class={obj.class}
            question={obj.question}
            type={obj.conditionType}
            key={i}
          />
        );
    });
    return (
      <>
        <form className="form-group">
          {inputs}
          <button className="btn" onClick={e => this.handleAddMainInput(e)}>
            Add Input
          </button>
        </form>
      </>
    );
  }
}
