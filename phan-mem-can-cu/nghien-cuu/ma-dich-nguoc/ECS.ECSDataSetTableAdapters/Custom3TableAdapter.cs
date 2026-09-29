using System.CodeDom.Compiler;
using System.ComponentModel;
using System.ComponentModel.Design;
using System.Data;
using System.Data.Common;
using System.Data.OleDb;
using System.Diagnostics;
using ECS.Properties;

namespace ECS.ECSDataSetTableAdapters;

[DataObject(true)]
[Designer("Microsoft.VSDesigner.DataSource.Design.TableAdapterDesigner, Microsoft.VSDesigner, Version=10.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a")]
[HelpKeyword("vs.data.TableAdapter")]
[DesignerCategory("code")]
[ToolboxItem(true)]
public class Custom3TableAdapter : Component
{
	private OleDbDataAdapter _adapter;

	private OleDbConnection _connection;

	private OleDbCommand[] _commandCollection;

	private bool _clearBeforeFill;

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private OleDbDataAdapter Adapter
	{
		get
		{
			if (_adapter == null)
			{
				InitAdapter();
			}
			return _adapter;
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	internal OleDbConnection Connection
	{
		get
		{
			if (_connection == null)
			{
				InitConnection();
			}
			return _connection;
		}
		set
		{
			_connection = value;
			if (Adapter.InsertCommand != null)
			{
				Adapter.InsertCommand.Connection = value;
			}
			if (Adapter.DeleteCommand != null)
			{
				Adapter.DeleteCommand.Connection = value;
			}
			if (Adapter.UpdateCommand != null)
			{
				Adapter.UpdateCommand.Connection = value;
			}
			for (int i = 0; i < CommandCollection.Length; i++)
			{
				if (CommandCollection[i] != null)
				{
					CommandCollection[i].Connection = value;
				}
			}
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	protected OleDbCommand[] CommandCollection
	{
		get
		{
			if (_commandCollection == null)
			{
				InitCommandCollection();
			}
			return _commandCollection;
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public bool ClearBeforeFill
	{
		get
		{
			return _clearBeforeFill;
		}
		set
		{
			_clearBeforeFill = value;
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public Custom3TableAdapter()
	{
		ClearBeforeFill = true;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private void InitAdapter()
	{
		_adapter = new OleDbDataAdapter();
		DataTableMapping dataTableMapping = new DataTableMapping();
		dataTableMapping.SourceTable = "Table";
		dataTableMapping.DataSetTable = "Custom3";
		dataTableMapping.ColumnMappings.Add("ID", "ID");
		dataTableMapping.ColumnMappings.Add("Text1", "Text1");
		dataTableMapping.ColumnMappings.Add("Text2", "Text2");
		dataTableMapping.ColumnMappings.Add("Text3", "Text3");
		dataTableMapping.ColumnMappings.Add("Text4", "Text4");
		dataTableMapping.ColumnMappings.Add("Text5", "Text5");
		dataTableMapping.ColumnMappings.Add("Text6", "Text6");
		dataTableMapping.ColumnMappings.Add("Text7", "Text7");
		dataTableMapping.ColumnMappings.Add("Text8", "Text8");
		dataTableMapping.ColumnMappings.Add("Text9", "Text9");
		dataTableMapping.ColumnMappings.Add("Text10", "Text10");
		dataTableMapping.ColumnMappings.Add("Text11", "Text11");
		dataTableMapping.ColumnMappings.Add("Text12", "Text12");
		dataTableMapping.ColumnMappings.Add("Text13", "Text13");
		dataTableMapping.ColumnMappings.Add("Text14", "Text14");
		dataTableMapping.ColumnMappings.Add("Text15", "Text15");
		dataTableMapping.ColumnMappings.Add("Text16", "Text16");
		dataTableMapping.ColumnMappings.Add("Text17", "Text17");
		dataTableMapping.ColumnMappings.Add("Text18", "Text18");
		dataTableMapping.ColumnMappings.Add("Text19", "Text19");
		dataTableMapping.ColumnMappings.Add("Text20", "Text20");
		dataTableMapping.ColumnMappings.Add("Text21", "Text21");
		dataTableMapping.ColumnMappings.Add("Text22", "Text22");
		dataTableMapping.ColumnMappings.Add("Text23", "Text23");
		dataTableMapping.ColumnMappings.Add("Text24", "Text24");
		dataTableMapping.ColumnMappings.Add("Text25", "Text25");
		dataTableMapping.ColumnMappings.Add("Text26", "Text26");
		dataTableMapping.ColumnMappings.Add("Text27", "Text27");
		dataTableMapping.ColumnMappings.Add("Text28", "Text28");
		dataTableMapping.ColumnMappings.Add("Text29", "Text29");
		dataTableMapping.ColumnMappings.Add("Text30", "Text30");
		dataTableMapping.ColumnMappings.Add("Text31", "Text31");
		dataTableMapping.ColumnMappings.Add("Text32", "Text32");
		dataTableMapping.ColumnMappings.Add("Text33", "Text33");
		dataTableMapping.ColumnMappings.Add("Text34", "Text34");
		dataTableMapping.ColumnMappings.Add("Text35", "Text35");
		dataTableMapping.ColumnMappings.Add("Text36", "Text36");
		dataTableMapping.ColumnMappings.Add("Text37", "Text37");
		dataTableMapping.ColumnMappings.Add("Text38", "Text38");
		dataTableMapping.ColumnMappings.Add("Text39", "Text39");
		dataTableMapping.ColumnMappings.Add("Text40", "Text40");
		dataTableMapping.ColumnMappings.Add("Int1", "Int1");
		dataTableMapping.ColumnMappings.Add("Int2", "Int2");
		dataTableMapping.ColumnMappings.Add("Int3", "Int3");
		dataTableMapping.ColumnMappings.Add("Int4", "Int4");
		dataTableMapping.ColumnMappings.Add("Int5", "Int5");
		dataTableMapping.ColumnMappings.Add("Int6", "Int6");
		dataTableMapping.ColumnMappings.Add("Int7", "Int7");
		dataTableMapping.ColumnMappings.Add("Int8", "Int8");
		dataTableMapping.ColumnMappings.Add("Int9", "Int9");
		dataTableMapping.ColumnMappings.Add("Int10", "Int10");
		dataTableMapping.ColumnMappings.Add("Int11", "Int11");
		dataTableMapping.ColumnMappings.Add("Int12", "Int12");
		dataTableMapping.ColumnMappings.Add("Int13", "Int13");
		dataTableMapping.ColumnMappings.Add("Int14", "Int14");
		dataTableMapping.ColumnMappings.Add("Int15", "Int15");
		dataTableMapping.ColumnMappings.Add("Int16", "Int16");
		dataTableMapping.ColumnMappings.Add("Int17", "Int17");
		dataTableMapping.ColumnMappings.Add("Int18", "Int18");
		dataTableMapping.ColumnMappings.Add("Int19", "Int19");
		dataTableMapping.ColumnMappings.Add("Int20", "Int20");
		dataTableMapping.ColumnMappings.Add("Int21", "Int21");
		dataTableMapping.ColumnMappings.Add("Int22", "Int22");
		dataTableMapping.ColumnMappings.Add("Int23", "Int23");
		dataTableMapping.ColumnMappings.Add("Int24", "Int24");
		dataTableMapping.ColumnMappings.Add("Int25", "Int25");
		dataTableMapping.ColumnMappings.Add("Int26", "Int26");
		dataTableMapping.ColumnMappings.Add("Int27", "Int27");
		dataTableMapping.ColumnMappings.Add("Int28", "Int28");
		dataTableMapping.ColumnMappings.Add("Int29", "Int29");
		dataTableMapping.ColumnMappings.Add("Int30", "Int30");
		dataTableMapping.ColumnMappings.Add("Int31", "Int31");
		dataTableMapping.ColumnMappings.Add("Int32", "Int32");
		dataTableMapping.ColumnMappings.Add("Int33", "Int33");
		dataTableMapping.ColumnMappings.Add("Int34", "Int34");
		dataTableMapping.ColumnMappings.Add("Int35", "Int35");
		dataTableMapping.ColumnMappings.Add("Int36", "Int36");
		dataTableMapping.ColumnMappings.Add("Int37", "Int37");
		dataTableMapping.ColumnMappings.Add("Int38", "Int38");
		dataTableMapping.ColumnMappings.Add("Int39", "Int39");
		dataTableMapping.ColumnMappings.Add("Int40", "Int40");
		dataTableMapping.ColumnMappings.Add("Dec1", "Dec1");
		dataTableMapping.ColumnMappings.Add("Dec2", "Dec2");
		dataTableMapping.ColumnMappings.Add("Dec3", "Dec3");
		dataTableMapping.ColumnMappings.Add("Dec4", "Dec4");
		dataTableMapping.ColumnMappings.Add("Dec5", "Dec5");
		dataTableMapping.ColumnMappings.Add("Dec6", "Dec6");
		dataTableMapping.ColumnMappings.Add("Dec7", "Dec7");
		dataTableMapping.ColumnMappings.Add("Dec8", "Dec8");
		dataTableMapping.ColumnMappings.Add("Dec9", "Dec9");
		dataTableMapping.ColumnMappings.Add("Dec10", "Dec10");
		dataTableMapping.ColumnMappings.Add("Dec11", "Dec11");
		dataTableMapping.ColumnMappings.Add("Dec12", "Dec12");
		dataTableMapping.ColumnMappings.Add("Dec13", "Dec13");
		dataTableMapping.ColumnMappings.Add("Dec14", "Dec14");
		dataTableMapping.ColumnMappings.Add("Dec15", "Dec15");
		dataTableMapping.ColumnMappings.Add("Dec16", "Dec16");
		dataTableMapping.ColumnMappings.Add("Dec17", "Dec17");
		dataTableMapping.ColumnMappings.Add("Dec18", "Dec18");
		dataTableMapping.ColumnMappings.Add("Dec19", "Dec19");
		dataTableMapping.ColumnMappings.Add("Dec20", "Dec20");
		dataTableMapping.ColumnMappings.Add("Dec21", "Dec21");
		dataTableMapping.ColumnMappings.Add("Dec22", "Dec22");
		dataTableMapping.ColumnMappings.Add("Dec23", "Dec23");
		dataTableMapping.ColumnMappings.Add("Dec24", "Dec24");
		dataTableMapping.ColumnMappings.Add("Dec25", "Dec25");
		dataTableMapping.ColumnMappings.Add("Dec26", "Dec26");
		dataTableMapping.ColumnMappings.Add("Dec27", "Dec27");
		dataTableMapping.ColumnMappings.Add("Dec28", "Dec28");
		dataTableMapping.ColumnMappings.Add("Dec29", "Dec29");
		dataTableMapping.ColumnMappings.Add("Dec30", "Dec30");
		dataTableMapping.ColumnMappings.Add("Dec31", "Dec31");
		dataTableMapping.ColumnMappings.Add("Dec32", "Dec32");
		dataTableMapping.ColumnMappings.Add("Dec33", "Dec33");
		dataTableMapping.ColumnMappings.Add("Dec34", "Dec34");
		dataTableMapping.ColumnMappings.Add("Dec35", "Dec35");
		dataTableMapping.ColumnMappings.Add("Dec36", "Dec36");
		dataTableMapping.ColumnMappings.Add("Dec37", "Dec37");
		dataTableMapping.ColumnMappings.Add("Dec38", "Dec38");
		dataTableMapping.ColumnMappings.Add("Dec39", "Dec39");
		dataTableMapping.ColumnMappings.Add("Dec40", "Dec40");
		_adapter.TableMappings.Add(dataTableMapping);
		_adapter.DeleteCommand = new OleDbCommand();
		_adapter.DeleteCommand.Connection = Connection;
		_adapter.DeleteCommand.CommandText = "DELETE FROM `Custom3` WHERE ((`ID` = ?))";
		_adapter.DeleteCommand.CommandType = CommandType.Text;
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_ID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "ID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand = new OleDbCommand();
		_adapter.InsertCommand.Connection = Connection;
		_adapter.InsertCommand.CommandText = "INSERT INTO `Custom3` (`ID`, `Text1`, `Text2`, `Text3`, `Text4`, `Text5`, `Text6`, `Text7`, `Text8`, `Text9`, `Text10`, `Text11`, `Text12`, `Text13`, `Text14`, `Text15`, `Text16`, `Text17`, `Text18`, `Text19`, `Text20`, `Text21`, `Text22`, `Text23`, `Text24`, `Text25`, `Text26`, `Text27`, `Text28`, `Text29`, `Text30`, `Text31`, `Text32`, `Text33`, `Text34`, `Text35`, `Text36`, `Text37`, `Text38`, `Text39`, `Text40`, `Int1`, `Int2`, `Int3`, `Int4`, `Int5`, `Int6`, `Int7`, `Int8`, `Int9`, `Int10`, `Int11`, `Int12`, `Int13`, `Int14`, `Int15`, `Int16`, `Int17`, `Int18`, `Int19`, `Int20`, `Int21`, `Int22`, `Int23`, `Int24`, `Int25`, `Int26`, `Int27`, `Int28`, `Int29`, `Int30`, `Int31`, `Int32`, `Int33`, `Int34`, `Int35`, `Int36`, `Int37`, `Int38`, `Int39`, `Int40`, `Dec1`, `Dec2`, `Dec3`, `Dec4`, `Dec5`, `Dec6`, `Dec7`, `Dec8`, `Dec9`, `Dec10`, `Dec11`, `Dec12`, `Dec13`, `Dec14`, `Dec15`, `Dec16`, `Dec17`, `Dec18`, `Dec19`, `Dec20`, `Dec21`, `Dec22`, `Dec23`, `Dec24`, `Dec25`, `Dec26`, `Dec27`, `Dec28`, `Dec29`, `Dec30`, `Dec31`, `Dec32`, `Dec33`, `Dec34`, `Dec35`, `Dec36`, `Dec37`, `Dec38`, `Dec39`, `Dec40`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
		_adapter.InsertCommand.CommandType = CommandType.Text;
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("ID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "ID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text1", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text2", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text3", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text4", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text5", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text5", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text6", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text6", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text7", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text7", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text8", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text8", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text9", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text9", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text10", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text10", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text11", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text11", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text12", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text12", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text13", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text13", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text14", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text14", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text15", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text15", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text16", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text16", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text17", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text17", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text18", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text18", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text19", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text19", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text20", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text20", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text21", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text21", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text22", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text22", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text23", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text23", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text24", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text24", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text25", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text25", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text26", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text26", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text27", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text27", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text28", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text28", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text29", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text29", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text30", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text30", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text31", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text31", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text32", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text32", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text33", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text33", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text34", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text34", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text35", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text35", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text36", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text36", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text37", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text37", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text38", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text38", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text39", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text39", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text40", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text40", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int5", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int5", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int6", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int6", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int7", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int7", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int8", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int8", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int9", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int9", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int10", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int10", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int11", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int11", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int12", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int12", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int13", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int13", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int14", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int14", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int15", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int15", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int16", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int16", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int17", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int17", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int18", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int18", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int19", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int19", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int20", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int20", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int21", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int21", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int22", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int22", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int23", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int23", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int24", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int24", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int25", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int25", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int26", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int26", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int27", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int27", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int28", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int28", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int29", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int29", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int30", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int30", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int31", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int31", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int32", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int32", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int33", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int33", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int34", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int34", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int35", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int35", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int36", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int36", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int37", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int37", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int38", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int38", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int39", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int39", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Int40", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int40", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec5", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec5", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec6", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec6", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec7", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec7", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec8", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec8", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec9", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec9", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec10", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec10", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec11", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec11", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec12", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec12", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec13", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec13", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec14", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec14", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec15", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec15", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec16", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec16", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec17", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec17", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec18", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec18", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec19", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec19", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec20", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec20", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec21", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec21", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec22", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec22", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec23", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec23", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec24", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec24", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec25", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec25", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec26", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec26", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec27", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec27", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec28", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec28", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec29", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec29", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec30", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec30", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec31", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec31", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec32", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec32", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec33", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec33", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec34", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec34", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec35", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec35", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec36", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec36", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec37", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec37", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec38", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec38", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec39", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec39", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dec40", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec40", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand = new OleDbCommand();
		_adapter.UpdateCommand.Connection = Connection;
		_adapter.UpdateCommand.CommandText = "UPDATE `Custom3` SET `ID` = ?, `Text1` = ?, `Text2` = ?, `Text3` = ?, `Text4` = ?, `Text5` = ?, `Text6` = ?, `Text7` = ?, `Text8` = ?, `Text9` = ?, `Text10` = ?, `Text11` = ?, `Text12` = ?, `Text13` = ?, `Text14` = ?, `Text15` = ?, `Text16` = ?, `Text17` = ?, `Text18` = ?, `Text19` = ?, `Text20` = ?, `Text21` = ?, `Text22` = ?, `Text23` = ?, `Text24` = ?, `Text25` = ?, `Text26` = ?, `Text27` = ?, `Text28` = ?, `Text29` = ?, `Text30` = ?, `Text31` = ?, `Text32` = ?, `Text33` = ?, `Text34` = ?, `Text35` = ?, `Text36` = ?, `Text37` = ?, `Text38` = ?, `Text39` = ?, `Text40` = ?, `Int1` = ?, `Int2` = ?, `Int3` = ?, `Int4` = ?, `Int5` = ?, `Int6` = ?, `Int7` = ?, `Int8` = ?, `Int9` = ?, `Int10` = ?, `Int11` = ?, `Int12` = ?, `Int13` = ?, `Int14` = ?, `Int15` = ?, `Int16` = ?, `Int17` = ?, `Int18` = ?, `Int19` = ?, `Int20` = ?, `Int21` = ?, `Int22` = ?, `Int23` = ?, `Int24` = ?, `Int25` = ?, `Int26` = ?, `Int27` = ?, `Int28` = ?, `Int29` = ?, `Int30` = ?, `Int31` = ?, `Int32` = ?, `Int33` = ?, `Int34` = ?, `Int35` = ?, `Int36` = ?, `Int37` = ?, `Int38` = ?, `Int39` = ?, `Int40` = ?, `Dec1` = ?, `Dec2` = ?, `Dec3` = ?, `Dec4` = ?, `Dec5` = ?, `Dec6` = ?, `Dec7` = ?, `Dec8` = ?, `Dec9` = ?, `Dec10` = ?, `Dec11` = ?, `Dec12` = ?, `Dec13` = ?, `Dec14` = ?, `Dec15` = ?, `Dec16` = ?, `Dec17` = ?, `Dec18` = ?, `Dec19` = ?, `Dec20` = ?, `Dec21` = ?, `Dec22` = ?, `Dec23` = ?, `Dec24` = ?, `Dec25` = ?, `Dec26` = ?, `Dec27` = ?, `Dec28` = ?, `Dec29` = ?, `Dec30` = ?, `Dec31` = ?, `Dec32` = ?, `Dec33` = ?, `Dec34` = ?, `Dec35` = ?, `Dec36` = ?, `Dec37` = ?, `Dec38` = ?, `Dec39` = ?, `Dec40` = ? WHERE ((`ID` = ?))";
		_adapter.UpdateCommand.CommandType = CommandType.Text;
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("ID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "ID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text1", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text2", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text3", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text4", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text5", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text5", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text6", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text6", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text7", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text7", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text8", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text8", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text9", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text9", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text10", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text10", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text11", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text11", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text12", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text12", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text13", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text13", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text14", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text14", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text15", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text15", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text16", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text16", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text17", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text17", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text18", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text18", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text19", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text19", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text20", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text20", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text21", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text21", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text22", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text22", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text23", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text23", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text24", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text24", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text25", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text25", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text26", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text26", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text27", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text27", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text28", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text28", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text29", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text29", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text30", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text30", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text31", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text31", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text32", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text32", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text33", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text33", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text34", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text34", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text35", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text35", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text36", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text36", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text37", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text37", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text38", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text38", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text39", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text39", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text40", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text40", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int5", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int5", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int6", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int6", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int7", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int7", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int8", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int8", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int9", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int9", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int10", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int10", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int11", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int11", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int12", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int12", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int13", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int13", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int14", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int14", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int15", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int15", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int16", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int16", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int17", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int17", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int18", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int18", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int19", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int19", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int20", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int20", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int21", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int21", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int22", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int22", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int23", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int23", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int24", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int24", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int25", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int25", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int26", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int26", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int27", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int27", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int28", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int28", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int29", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int29", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int30", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int30", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int31", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int31", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int32", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int32", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int33", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int33", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int34", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int34", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int35", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int35", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int36", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int36", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int37", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int37", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int38", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int38", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int39", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int39", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Int40", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Int40", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec5", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec5", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec6", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec6", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec7", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec7", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec8", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec8", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec9", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec9", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec10", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec10", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec11", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec11", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec12", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec12", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec13", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec13", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec14", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec14", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec15", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec15", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec16", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec16", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec17", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec17", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec18", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec18", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec19", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec19", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec20", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec20", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec21", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec21", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec22", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec22", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec23", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec23", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec24", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec24", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec25", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec25", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec26", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec26", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec27", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec27", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec28", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec28", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec29", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec29", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec30", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec30", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec31", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec31", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec32", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec32", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec33", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec33", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec34", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec34", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec35", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec35", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec36", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec36", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec37", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec37", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec38", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec38", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec39", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec39", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dec40", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Dec40", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_ID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "ID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private void InitConnection()
	{
		_connection = new OleDbConnection();
		_connection.ConnectionString = Settings.Default.ECSConnectionString;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private void InitCommandCollection()
	{
		_commandCollection = new OleDbCommand[1];
		_commandCollection[0] = new OleDbCommand();
		_commandCollection[0].Connection = Connection;
		_commandCollection[0].CommandText = "SELECT ID, Text1, Text2, Text3, Text4, Text5, Text6, Text7, Text8, Text9, Text10, Text11, Text12, Text13, Text14, Text15, Text16, Text17, Text18, Text19, Text20, Text21, Text22, Text23, Text24, Text25, Text26, Text27, Text28, Text29, Text30, Text31, Text32, Text33, Text34, Text35, Text36, Text37, Text38, Text39, Text40, Int1, Int2, Int3, Int4, Int5, Int6, Int7, Int8, Int9, Int10, Int11, Int12, Int13, Int14, Int15, Int16, Int17, Int18, Int19, Int20, Int21, Int22, Int23, Int24, Int25, Int26, Int27, Int28, Int29, Int30, Int31, Int32, Int33, Int34, Int35, Int36, Int37, Int38, Int39, Int40, Dec1, Dec2, Dec3, Dec4, Dec5, Dec6, Dec7, Dec8, Dec9, Dec10, Dec11, Dec12, Dec13, Dec14, Dec15, Dec16, Dec17, Dec18, Dec19, Dec20, Dec21, Dec22, Dec23, Dec24, Dec25, Dec26, Dec27, Dec28, Dec29, Dec30, Dec31, Dec32, Dec33, Dec34, Dec35, Dec36, Dec37, Dec38, Dec39, Dec40 FROM Custom3\r\nORDER BY ID";
		_commandCollection[0].CommandType = CommandType.Text;
	}

	[DebuggerNonUserCode]
	[DataObjectMethod(DataObjectMethodType.Fill, true)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Fill(ECSDataSet.Custom3DataTable dataTable)
	{
		Adapter.SelectCommand = CommandCollection[0];
		if (ClearBeforeFill)
		{
			dataTable.Clear();
		}
		return Adapter.Fill(dataTable);
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public virtual int Update(ECSDataSet.Custom3DataTable dataTable)
	{
		return Adapter.Update(dataTable);
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	public virtual int Update(ECSDataSet dataSet)
	{
		return Adapter.Update(dataSet, "Custom3");
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(DataRow dataRow)
	{
		return Adapter.Update(new DataRow[1] { dataRow });
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(DataRow[] dataRows)
	{
		return Adapter.Update(dataRows);
	}
}
