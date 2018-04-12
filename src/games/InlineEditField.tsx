import * as React from 'react';
import { TextField } from 'material-ui';
import { observer } from 'mobx-react';

@observer
class InlineEditField extends React.Component<{ data: any, field: string, onChange: any }> {
    state = {
        data: this.props.data
    };

    constructor(props: any) {
        super(props);

        this.handleInputChange = this.handleInputChange.bind(this);
    }

    private handleInputChange(evt: any, checked?) {
        const value = evt.target.type === 'checkbox' ? checked : evt.target.value;
        const name = evt.target.name;
        let dataCopy = this.state.data;
        dataCopy[name]= value;
        this.setState({ data: dataCopy });
        this.props.onChange(dataCopy);
    }

    render() {
        return (
            <TextField value={this.state.data[this.props.field]} onChange={this.handleInputChange} name={this.props.field} />
        )
    }
}

export default InlineEditField;