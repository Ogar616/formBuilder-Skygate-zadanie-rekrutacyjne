import React, { Component } from "react";

export default class MainInput extends Component {
  state = {
    question: this.props.question,
    type: this.props.type
  };

  handleSelectChange = e => {
    this.setState({ type: e.target.value });
  };

  handleQuestionChange = e => {
    this.setState({ question: e.target.value });
  };

  handleDeleteInput = e => {
    e.preventDefault();
    this.props.handleDelete(this.props.index);
  };

  handleAddSubInput = e => {
    e.preventDefault();
    this.props.handleAddSubInput(
      this.props.index,
      this.state.question,
      this.state.type
    );
  };

  render() {
    const formClass = `form-wrapper ${this.props.class}`;
    return (
      <>
        <fieldset className={formClass}>
          <div className="input-container">
            <div className="form-row">
              <span>Question</span>
              <input
                type="text"
                placeholder="Type your qestion"
                value={this.props.question}
                onChange={this.handleQuestionChange}
              />
            </div>
            <div className="form-row">
              <span>Type</span>
              <select
                value={this.props.type}
                onChange={this.handleSelectChange}
              >
                <option value="Yes / No">Yes / No</option>
                <option value="Text">Text</option>
                <option value="Number">Number</option>
              </select>
            </div>
            <div className="buttons">
              <button className="btn" onClick={this.handleAddSubInput}>
                Add Sub-Input
              </button>
              <button className="btn" onClick={this.handleDeleteInput}>
                Delete Input
              </button>
            </div>
          </div>
        </fieldset>
      </>
    );
  }
}
