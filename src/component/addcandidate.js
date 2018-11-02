import React, { Component } from "react";
import { Drawer, Card, Radio, Tooltip, Form, Button, Col, Row, Input, Select, DatePicker, Icon, Breadcrumb } from 'antd';

const FormItem = Form.Item;

let cand_uuid = 2;

class AddCandidate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      visible: false
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

    getFieldDecorator('candKeys', { initialValue: [0, 1] });
    const candKeys = getFieldValue('candKeys');
    const candFormItems = candKeys.map((k, index) => {
      return (
        <FormItem
          {...formItemLayoutWithOutLabel}
          required={false}
          key={k}
        >
          {getFieldDecorator(`candidates[${k}]`, {
            validateTrigger: ['onChange', 'onBlur'],
            rules: [{
              required: true,
              whitespace: true,
              message: "Please input candidate's name.",
            }],
          })(
            <Input placeholder="candidate name" style={{ width: '80%', marginRight: 8 }} />
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
      );
    });

    return (
      <Card title="Candidates" bordered={false}>
        <FormItem {...formItemLayoutWithOutLabel}>
          <Button type="dashed" onClick={this.addCand} style={{ width: '80%' }}>
            <Icon type="plus" /> Add Candidate
          </Button>
        </FormItem>
        {candFormItems}
      </Card>
    )
  }
}

export default Form.create()(AddCandidate);

