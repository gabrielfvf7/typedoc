import * as ts from 'typescript';
import { Reflection } from '../../models/index';
import { Context } from '../context';
import { ConverterNodeComponent } from '../components';
export declare class InterfaceConverter extends ConverterNodeComponent<ts.InterfaceDeclaration> {
    supports: ts.SyntaxKind[];
    convert(context: Context, node: ts.InterfaceDeclaration): Reflection;
}
