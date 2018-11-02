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

    const formItemLayoutWithOutLabel = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 20, offset: 4 },
      },
    };
    getFieldDecorator('vtrKeys', { initialValue: [0] });
    const vtrKeys = getFieldValue('vtrKeys');

    const vtrFormItems = vtrKeys.map((k, index) => {
      return (
        <FormItem
          {...formItemLayoutWithOutLabel}
          required={false}
          key={k}
        >
          {getFieldDecorator(`voters[${k}]`, {
            validateTrigger: ['onChange', 'onBlur'],
            rules: [{type: 'email', message: 'The input is not valid E-mail!'}, {required: true, message: "Please input voter's E-mail!" }],
          })(
            <Input placeholder="Please enter voter email" style={{ width: '80%', marginRight: 8 }} />
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
      <Card title="Voters" bordered={false}>
          <FormItem {...formItemLayoutWithOutLabel}>
            <Button type="dashed" onClick={this.addVtr} style={{ width: '80%' }}>
              <Icon type="plus" /> Add Voter
            </Button>
          </FormItem>
          {vtrFormItems}
      </Card>
    )
  }
}

export default Form.create()(AddVoter);

