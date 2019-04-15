import React, {
  FunctionComponent,
  CSSProperties,
  useState,
  useMemo
} from "react";
import { Popover, InputNumber } from "antd";
import { merge } from "lodash";
import { SketchPicker } from "react-color";
import "./Toolbar.scss";

export interface ToolButtonProps {
  className?: string;
  style?: CSSProperties;
  onClick: () => void;
}

export const ToolButton: FunctionComponent<ToolButtonProps> = props => {
  return (
    <div
      style={props.style}
      className={props.className}
      onClick={props.onClick}
    >
      <div className="sidebar-btn-content" />
    </div>
  );
};

export interface Tools {
  selector: boolean;
  pencil: boolean;
  rectangle: boolean;
  ellipse: boolean;
  eraser: boolean;
  text: boolean;
  font: boolean;
  color: boolean;
  add: boolean;
  share: boolean;
  [key: string]: any;
}

export interface ToolbarProps {
  tools: Partial<Tools>;
  readyState: boolean;
  onChangeMemberState: (action: {[prop: string]: any}) => void;
  onAddPage: () => void;
  onSwitchScreenShare: () => void;
}

export const Toolbar: FunctionComponent<ToolbarProps> = props => {
  const defaultTools = {
    // basic tools of whiteboard
    selector: true,
    pencil: true,
    rectangle: true,
    ellipse: true,
    eraser: true,
    text: true,
    // additional tools 
    font: true,
    color: true,
    add: true,
    share: true,
  };
  const {tools} = props

  const [selectedTool, switchTool] = useState("pencil");

  const [colorPickerVisible, switchColorPicker] = useState(false);

  const [fontPickerVisible, switchFontPicker] = useState(false);

  const hasPopover = useMemo(() => {
    return colorPickerVisible || fontPickerVisible
  }, [colorPickerVisible, fontPickerVisible])

  // methods
  const onTextSizeChange = (value?: number) => {
    if (value !== undefined) {
      props.onChangeMemberState({
        textsize: value
      })
    }
  }

  const onColorChanged = (color: any) => {
    const {rgb} = color;
    const {r, g, b} = rgb;
    props.onChangeMemberState({
      strokeColor: [r, g, b]
    })
  } 

  const onHidePopover = () => {
    switchColorPicker(false);
    switchFontPicker(false);
  }

  const ToolGen = (type: keyof Tools) => {
    if (type === "font") {
      return (
        <Popover
          key={type}
          placement="right"
          content={<InputNumber min={12} max={64} defaultValue={15} onChange={onTextSizeChange} />}
          title="Font Size"
          visible={fontPickerVisible}
        >
          <ToolButton 
            className={`sidebar-btn ${type} ${selectedTool === type ? 'selected' : ''}`}
            onClick={() => switchFontPicker(true)}
          />
        </Popover>
      );
    } else if (type === 'color') {
      return (
        <ToolButton
          key={type}
          onClick={() => switchColorPicker(true)}
          className={`sidebar-btn ${type} ${selectedTool === type ? 'selected' : ''}`}
        />
      )
    } else if (type === 'add') {
      return (
        <ToolButton
          key={type}
          onClick={() => props.onAddPage()}
          className={`sidebar-btn ${type} ${selectedTool === type ? 'selected' : ''}`}
        />
      )
    } else if (type === 'share') {
      return (
        <ToolButton
          key={type}
          onClick={() => props.onSwitchScreenShare()}
          className={`sidebar-btn ${type} ${selectedTool === type ? 'selected' : ''}`}
        />
      )
    } else {
      return (
        <ToolButton
          key={type}
          onClick={() => {
            switchTool(String(type))
            props.onChangeMemberState({
              currentApplianceName: type
            })
          }}
          className={`sidebar-btn ${type} ${selectedTool === type ? 'selected' : ''}`}
        />
      )
    }
  };

  // tool list
  const ToolList = useMemo(() => {
    const currentTools = merge(defaultTools, props.tools);
    return Object.keys(currentTools).filter(item => currentTools[item]).map(item => {
      return ToolGen(item)
    })
  }, [tools])

  return (
    <div className="sidebar">
      {/* mask for popover */}
      <div className={`mask ${ hasPopover ? '' : 'hidden' }`} onClick={onHidePopover}></div>
      {/* color picker popover */}
      <div className={`color-picker ${ colorPickerVisible? '' : 'hidden' }`}>
          <SketchPicker onChangeComplete={onColorChanged} />
      </div>
      {/* tool list */}
      <div className="bar-container">
        <div className={props.readyState? '' : 'unusable' }>
          {ToolList}
        </div>
      </div>
    </div>
  )
};

export default Toolbar;
