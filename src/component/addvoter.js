import React, { Component } from "react";
import { Radio, Card, Tooltip, Form, Button, Col, Row, Input, Select, DatePicker, Icon, Breadcrumb } from 'antd';

const FormItem = Form.Item;

let vtr_uuid = 1;

class AddVoter extends Component {
  constructor(props) {
    super(props);
    this.state = this.props.state;
  }

  removeVtr = (k) => {
    const { form } = this.props;
    const keys = form.getFieldValue('vtrKeys');
    if (keys.length === 1) {
      return;
    }

    form.setFieldsValue({
      vtrKeys: keys.filter(key => key !== k),
    });
  }
  addVtr = () => {
    const { form } = this.props;
    const keys = form.getFieldValue('vtrKeys');
    const nextKeys = [vtr_uuid, ...keys];
    vtr_uuid++;
    form.setFieldsValue({
      vtrKeys: nextKeys,
    });
  }

  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;

    getFieldDecorator('vtrKeys', { initialValue: [0] });
    const vtrKeys = getFieldValue('vtrKeys');

    const vtrFormItems = vtrKeys.map((k, index) => {
      return (
        <FormItem
          required={false}
          key={k}
        >
          {getFieldDecorator(`voters[${k}]`, {
            validateTrigger: ['onChange', 'onBlur'],
            rules: [{type: 'email', message: 'The input is not valid E-mail!'}, {required: true, message: "Please input voter's E-mail!" }],
          })(
            <Input placeholder="Email"
              prefix={<Icon type="mail" style={{ color: 'rgba(0,0,0,.25)' }} />}
              style={{ width: '90%', marginRight: 8 }} />
          )}
          {vtrKeys.length > 1 ? (
            <Icon
              className="dynamic-delete-button"
              type="minus-circle-o"
              disabled={vtrKeys.length === 2}
              onClick={() => this.removeVtr(k)}
            />
          ) : null}
        </FormItem>
      );
    });

    return (
      <div>
        <FormItem>
          <Button type="dashed" onClick={this.addVtr} style={{ width: '90%' }}>
            <Icon type="user-add" /> Add Voter
          </Button>
        </FormItem>
        {vtrFormItems}
      </div>
    )
  }
}

export default Form.create()(AddVoter);

