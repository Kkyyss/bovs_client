import React, { Component } from "react";
import { Drawer, Card, Modal, Radio, Tooltip, Form, Button, Col, Row, Input, Select, DatePicker, Icon, Breadcrumb } from 'antd';

const FormItem = Form.Item;
const { TextArea } = Input;

let cand_uuid = 2;

class AddCandidate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      visible: false,
      candModal: []
    }
  }


  showDrawer = () => {
    this.setState({
      visible: true,
    });
  };
  onClose = () => {
    this.setState({
      visible: false,
    });
  };

  removeCand = (k) => {
    const { form } = this.props;
    const keys = form.getFieldValue('candKeys');
    if (keys.length === 2) {
      return;
    }

    form.setFieldsValue({
      candKeys: keys.filter(key => key !== k),
    });
  }
  addCand = () => {
    const { form } = this.props;
    const keys = form.getFieldValue('candKeys');
    const nextKeys = [cand_uuid, ...keys];
    cand_uuid++;
    form.setFieldsValue({
      candKeys: nextKeys,
    });
  }

  handleVs = (k) => {
    let {candModal} = this.state;
    candModal[k] = true;
    this.setState({
      candModal
    })
  }
  handleVsClose = (k) => {
    let {candModal} = this.state;
    candModal[k] = false;
    this.setState({
      candModal
    })
  }

  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;

    getFieldDecorator('candKeys', { initialValue: [0, 1] });
    const candKeys = getFieldValue('candKeys');
    const candFormItems = candKeys.map((k, index) => {
      return (
        <div key={k}>
          <FormItem
            required={true}
          >
            {getFieldDecorator(`candidates_name[${k}]`, {
              validateTrigger: ['onChange', 'onBlur'],
              rules: [{
                required: true,
                whitespace: true,
                message: "Please input candidate/option name.",
              }],
            })(
              <Input className='input-setting' placeholder="name"
                prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                suffix={
                  <Button type="primary" onClick={() => this.handleVs(k)} icon="setting"/>
                }
                style={{ width: '90%', marginRight: 8 }} />
            )}
            {candKeys.length > 2 ? (
              <Icon
                className="dynamic-delete-button"
                type="minus-circle-o"
                disabled={candKeys.length === 2}
                onClick={() => this.removeCand(k)}
              />
            ) : null}
          </FormItem>
          <Modal
            visible={this.state.candModal[k]}
            title="Optional Setting"
            footer={null}
            onCancel={() => this.handleVsClose(k)}
          >
            <FormItem
              label="Candidate/Option Image URL" extra="Example: jpg, png">
                {getFieldDecorator(`candidates_img[${k}]`)(<Input placeholder="title image url" />)}
            </FormItem>
            <FormItem
              label="Description" extra="">
              {getFieldDecorator(`candidates_desc[${k}]`, {})(<TextArea autosize placeholder="Description about the event..." />)}
            </FormItem>
          </Modal>
        </div>
      );
    });

    return (
      <div>
        <FormItem>
          <Button type="dashed" onClick={this.addCand} style={{ width: '90%' }}>
            <Icon type="user-add" /> Add Candidate/Option
          </Button>
        </FormItem>
        {candFormItems}
      </div>
    )
  }
}

export default Form.create()(AddCandidate);

