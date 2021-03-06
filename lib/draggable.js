import * as React from "react";
import { PanResponder, Animated } from "react-native";
export function draggable(Consumer) {
    class BaseDraggable extends React.Component {
        constructor(props) {
            super(props);
            this.onLayout = (...args) => {
                if (this.props.onLayout) {
                    this.props.onLayout(...args);
                }
                this.measure();
            };
            this.handleRef = (element) => {
                if (element && element.getNode) {
                    this.element = element.getNode();
                }
                else {
                    this.element = element;
                }
            };
            this.identifier = props.customId || Symbol("draggable");
            this.state = {
                pan: new Animated.ValueXY()
            };
            this.moveEvent = Animated.event([
                null,
                {
                    dx: this.state.pan.x,
                    dy: this.state.pan.y
                }
            ]);
            this.panResponder = PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onPanResponderMove: (e, gesture) => {
                    const { pageX, pageY } = e.nativeEvent;
                    this.props.__dndContext.handleDragMove(this.identifier, {
                        x: pageX,
                        y: pageY
                    });
                    this.moveEvent(e, gesture);
                },
                onPanResponderStart: e => {
                    const { pageX, pageY } = e.nativeEvent;
                    this.props.__dndContext.handleDragStart(this.identifier, {
                        x: pageX,
                        y: pageY
                    });
                },
                onPanResponderRelease: e => {
                    const { pageX, pageY } = e.nativeEvent;
                    if (this.props.bounceBack) {
                        Animated.spring(this.state.pan, {
                            toValue: { x: 0, y: 0 }
                        }).start();
                    }
                    this.props.__dndContext.handleDragEnd(this.identifier, {
                        x: pageX,
                        y: pageY
                    });
                }
            });
        }
        componentDidMount() {
            this.props.__dndContext.registerDraggable(this.identifier, {
                onDragStart: this.props.onDragStart,
                onDragEnd: this.props.onDragEnd,
                payload: this.props.payload
            });
        }
        componentWillUnmount() {
            this.props.__dndContext.unregisterDraggable(this.identifier);
        }
        componentDidUpdate(prevProps) {
            const updatedDraggable = {};
            if (prevProps.onDragEnd !== this.props.onDragEnd) {
                updatedDraggable.onDragEnd = this.props.onDragEnd;
            }
            if (prevProps.onDragStart !== this.props.onDragStart) {
                updatedDraggable.onDragStart = this.props.onDragStart;
            }
            if (prevProps.payload !== this.props.payload) {
                updatedDraggable.payload = this.props.payload;
            }
            if (Object.keys(updatedDraggable).length !== 0) {
                this.props.__dndContext.updateDraggable(this.identifier, updatedDraggable);
            }
        }
        measure() {
            if (this.element) {
                this.element.measureInWindow((x, y, width, height) => {
                    this.props.__dndContext.updateDraggable(this.identifier, {
                        layout: { x, y, width, height }
                    });
                });
            }
        }
        render() {
            const { children } = this.props;
            return children({
                viewProps: Object.assign({ onLayout: this.onLayout, ref: this.handleRef, style: {
                        transform: this.state.pan.getTranslateTransform()
                    } }, this.panResponder.panHandlers)
            });
        }
    }
    BaseDraggable.defaultProps = {
        bounceBack: true
    };
    const Draggable = React.forwardRef((props, ref) => (React.createElement(Consumer, null, dndContext => (React.createElement(BaseDraggable, Object.assign({}, props, { ref: ref, __dndContext: dndContext }))))));
    Draggable.displayName = "ConnectedDraggable";
    return Draggable;
}
