"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var _ts = require("../../ts-internal");
var index_1 = require("../../models/index");
var index_2 = require("../factories/index");
var components_1 = require("../components");
var index_3 = require("../index");
var VariableConverter = (function (_super) {
    __extends(VariableConverter, _super);
    function VariableConverter() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.supports = [
            ts.SyntaxKind.PropertySignature,
            ts.SyntaxKind.PropertyDeclaration,
            ts.SyntaxKind.PropertyAssignment,
            ts.SyntaxKind.ShorthandPropertyAssignment,
            ts.SyntaxKind.VariableDeclaration,
            ts.SyntaxKind.BindingElement
        ];
        return _this;
    }
    VariableConverter.prototype.isSimpleObjectLiteral = function (objectLiteral) {
        if (!objectLiteral.properties) {
            return true;
        }
        return objectLiteral.properties.length === 0;
    };
    VariableConverter.prototype.convert = function (context, node) {
        var _this = this;
        var comment = index_2.createComment(node);
        if (comment && comment.hasTag('resolve')) {
            var resolveType = context.getTypeAtLocation(node);
            if (resolveType && resolveType.symbol) {
                var resolved = this.owner.convertNode(context, resolveType.symbol.declarations[0]);
                if (resolved) {
                    resolved.name = node.symbol.name;
                }
                return resolved;
            }
        }
        var name, isBindingPattern;
        if (_ts.isBindingPattern(node.name)) {
            if (node['propertyName']) {
                name = _ts.declarationNameToString(node['propertyName']);
                isBindingPattern = true;
            }
            else {
                return null;
            }
        }
        var scope = context.scope;
        var kind = scope.kind & index_1.ReflectionKind.ClassOrInterface ? index_1.ReflectionKind.Property : index_1.ReflectionKind.Variable;
        var variable = index_2.createDeclaration(context, node, kind, name);
        if (variable) {
            switch (kind) {
                case index_1.ReflectionKind.Variable:
                    if (node.parent.flags & ts.NodeFlags.Const) {
                        variable.setFlag(index_1.ReflectionFlag.Const, true);
                    }
                    else if (node.parent.flags & ts.NodeFlags.Let) {
                        variable.setFlag(index_1.ReflectionFlag.Let, true);
                    }
                    break;
                case index_1.ReflectionKind.Property:
                    if (node.modifiers
                        && node.modifiers.some(function (m) { return m.kind === ts.SyntaxKind.AbstractKeyword; })) {
                        variable.setFlag(index_1.ReflectionFlag.Abstract, true);
                    }
                    break;
            }
        }
        context.withScope(variable, function () {
            if (node.initializer) {
                switch (node.initializer.kind) {
                    case ts.SyntaxKind.ArrowFunction:
                    case ts.SyntaxKind.FunctionExpression:
                        variable.kind = scope.kind & index_1.ReflectionKind.ClassOrInterface ? index_1.ReflectionKind.Method : index_1.ReflectionKind.Function;
                        _this.owner.convertNode(context, node.initializer);
                        break;
                    case ts.SyntaxKind.ObjectLiteralExpression:
                        if (!_this.isSimpleObjectLiteral(node.initializer)) {
                            variable.kind = index_1.ReflectionKind.ObjectLiteral;
                            variable.type = new index_1.IntrinsicType('object');
                            _this.owner.convertNode(context, node.initializer);
                        }
                        break;
                    default:
                        variable.defaultValue = index_3.convertDefaultValue(node);
                }
            }
            if (variable.kind === kind || variable.kind === index_1.ReflectionKind.Event) {
                if (isBindingPattern) {
                    variable.type = _this.owner.convertType(context, node.name);
                }
                else {
                    variable.type = _this.owner.convertType(context, node.type, context.getTypeAtLocation(node));
                }
            }
        });
        return variable;
    };
    VariableConverter = __decorate([
        components_1.Component({ name: 'node:variable' })
    ], VariableConverter);
    return VariableConverter;
}(components_1.ConverterNodeComponent));
exports.VariableConverter = VariableConverter;
//# sourceMappingURL=variable.js.map