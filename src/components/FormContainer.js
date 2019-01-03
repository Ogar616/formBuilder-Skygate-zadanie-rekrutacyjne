import React, { Component } from 'react';
import MainInput from './formComponents/MainInput';
import SubInput from './formComponents/SubInput';
import Dexie from 'dexie';
import db from '../dixie';

class FormContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            structure: ([
            
            ]),
            newInput: {
                text: '',
                select: '',
                firstConditionFieldValue: '',
                secondConditionFieldValue: ''
            }
        }
    }

    transformToFlatStructure(a, r) {
        a.forEach(({children, ...rest}) => {
        r.push(rest);
        if(children) this.transformToFlatStructure(children, r)
        });
    }

    promise = db.structures.toArray().then(response => {
        return response
        }).then(state => {
            this.setState({structure: state})
    })

    generateNewId() {
        let idsArray = [];

        for (let i = 0 ; i < this.state.structure.length ; i++){
           idsArray.push(parseInt(this.state.structure[i].id));
        }
        return (Math.max(...idsArray) + 1).toLocaleString();
    }
    
    handleAddMainInput(e){
        e.preventDefault();
        let inputs = this.state.structure;
        let newInput;

        if (inputs.length > 0) {
            newInput = {
                    'id': this.generateNewId(),
                    'parentId': '0', 
                    'type': 'main'
                }
        } else newInput = {
            'id': '1',
            'parentId': '0', 
            'type': 'main'
        };
        inputs.push(newInput);
    
        this.setState({structure: inputs}, this.updateDB);    
    }

    transformToTree = list => {
        let map = {}, node, roots = [];
        for (let i = 0; i < list.length; i ++) {
            map[list[i].id] = i;
            list[i].children = [];
        }
        for (let i = 0 ; i < list.length ; i++) {
            node = list[i];
            if (node.parentId !== '0') {
                if (list[map[node.parentId]]){
                    list[map[node.parentId]].children.push(node);
                }
             
            } else {
                roots.push(node);
            }
        }
        return roots;
    }

    handleDeleteSubInput(i) {
        let inputs = this.state.structure;

        inputs.splice(i, 1);
        this.setState({structure: inputs}, this.updateDB);
    }

    updateDB(){
        const n = 0;
        Dexie.spawn(function*() {
            yield db.structures
            .where('id')
            .above(n.toLocaleString())
            .delete()    
            var tasks = yield db.structures.toArray();
            console.log("Structureeeee" + JSON.stringify(tasks, 0, 2));
        }).catch (err => {
            console.error ('Deleting from db failed' + err.stack);
        });
        const inputs = this.transformToTree(this.state.structure);

        Dexie.spawn(function*() {
            yield db.structures.bulkPut(inputs)
            }).catch (err => {
            console.error ('Ooops' + err.stack);
            });
    }

    handleDeleteInput(i) {
        let inputs = this.state.structure;
        const start = i;

        inputs.splice(i, 1);

        for (let i = start ; i < inputs.length ; i++) {
            if (inputs[i]){
                if (inputs[i].type === 'sub'){
                    inputs.splice(i, 1);
                    i--;
                    continue;
                }
                if (inputs[i].type === 'main') break;    
            }
        }
        this.setState({structure: inputs}, this.updateDB);
    }

    handleAddSubInput(i, question, type, firstConditionField, secondConditionField) {
        let inputs = this.state.structure;
        const parentInputId = inputs[i].id;

        const subInputStructure = {
            'id': this.generateNewId(),
            'parentId': parentInputId.toLocaleString(),
            'type': 'sub',
        }

        const newStructure = inputs.slice(0, i + 1).concat(subInputStructure, this.state.structure.slice(i + 1));

        newStructure[i].question = question;
        newStructure[i].conditionType = type;
        if(firstConditionField){
            newStructure[i].firstConditionField = firstConditionField;
        }
        if (secondConditionField){
            newStructure[i].secondConditionField = secondConditionField;
        }

        // this.addToDB(subInputStructure.id, subInputStructure.parentId, subInputStructure.type, newStructure[i].question, newStructure[i].conditionType, newStructure[i].firstConditionField,newStructure[i].secondConditionField);
        console.log(this.state.structure);
        this.setState({
            structure: newStructure, 
            newInput: {
                text: question, 
                select: type,
                firstConditionFieldValue: firstConditionField,
                secondConditionFieldValue: secondConditionField
            }}, this.updateDB);
          
    }

    render() {
        const inputs = this.state.structure.map((e, i) => {
            if (e.type === 'sub') return (
                <SubInput type='Number' 
                          handleAddSubInput={(e, question, type, firstConditionField, secondConditionField) => this.handleAddSubInput(e, question, type, firstConditionField, secondConditionField)} 
                          handleDelete={e => this.handleDeleteSubInput(e)} 
                          input={this.state.newInput}
                          index={i} 
                          key={i}/>
            )
            else return (
                <MainInput handleAddSubInput={(e, question, type) => this.handleAddSubInput(e, question, type)} 
                           handleDelete={e => this.handleDeleteInput(e)} 
                           index={i} 
                           key ={i}/>
            )
        })
        return (
            <form className='form-group'>
                {inputs}
                <button className='btn'onClick={e => this.handleAddMainInput(e)}>Add Input</button>
                <button className='btn' onClick={e=>this.handleStore(e)}>######################################</button>
            </form>
        )
    }
}

export default FormContainer;


// structures: 'id, parentId, type, question, conditionType, firstConditionField, secondConditionField'