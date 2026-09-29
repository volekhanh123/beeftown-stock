using System.CodeDom.Compiler;
using System.ComponentModel;
using System.ComponentModel.Design;
using System.Data;
using System.Data.Common;
using System.Data.OleDb;
using System.Diagnostics;
using ECS.Properties;

namespace ECS.ECSDataSetTableAdapters;

[ToolboxItem(true)]
[Designer("Microsoft.VSDesigner.DataSource.Design.TableAdapterDesigner, Microsoft.VSDesigner, Version=10.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a")]
[HelpKeyword("vs.data.TableAdapter")]
[DesignerCategory("code")]
[DataObject(true)]
public class LabelTableAdapter : Component
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

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
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

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public LabelTableAdapter()
	{
		ClearBeforeFill = true;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private void InitAdapter()
	{
		_adapter = new OleDbDataAdapter();
		DataTableMapping dataTableMapping = new DataTableMapping();
		dataTableMapping.SourceTable = "Table";
		dataTableMapping.DataSetTable = "Label";
		dataTableMapping.ColumnMappings.Add("LabelID", "LabelID");
		dataTableMapping.ColumnMappings.Add("Width", "Width");
		dataTableMapping.ColumnMappings.Add("Height", "Height");
		dataTableMapping.ColumnMappings.Add("Sort", "Sort");
		dataTableMapping.ColumnMappings.Add("Name", "Name");
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
		dataTableMapping.ColumnMappings.Add("Version", "Version");
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
		_adapter.TableMappings.Add(dataTableMapping);
		_adapter.DeleteCommand = new OleDbCommand();
		_adapter.DeleteCommand.Connection = Connection;
		_adapter.DeleteCommand.CommandText = "DELETE FROM `Label` WHERE ((`LabelID` = ?))";
		_adapter.DeleteCommand.CommandType = CommandType.Text;
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_LabelID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand = new OleDbCommand();
		_adapter.InsertCommand.Connection = Connection;
		_adapter.InsertCommand.CommandText = "INSERT INTO `Label` (`LabelID`, `Width`, `Height`, `Sort`, `Name`, `Text1`, `Text2`, `Text3`, `Text4`, `Text5`, `Text6`, `Text7`, `Text8`, `Text9`, `Text10`, `Text11`, `Text12`, `Text13`, `Text14`, `Text15`, `Text16`, `Version`, `Text17`, `Text18`, `Text19`, `Text20`, `Text21`, `Text22`, `Text23`, `Text24`, `Text25`, `Text26`, `Text27`, `Text28`, `Text29`, `Text30`, `Text31`, `Text32`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
		_adapter.InsertCommand.CommandType = CommandType.Text;
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("LabelID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Width", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Width", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Height", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Height", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Sort", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Sort", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Name", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Current, sourceColumnNullMapping: false, null));
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
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Version", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Version", DataRowVersion.Current, sourceColumnNullMapping: false, null));
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
		_adapter.UpdateCommand = new OleDbCommand();
		_adapter.UpdateCommand.Connection = Connection;
		_adapter.UpdateCommand.CommandText = "UPDATE `Label` SET `LabelID` = ?, `Width` = ?, `Height` = ?, `Sort` = ?, `Name` = ?, `Text1` = ?, `Text2` = ?, `Text3` = ?, `Text4` = ?, `Text5` = ?, `Text6` = ?, `Text7` = ?, `Text8` = ?, `Text9` = ?, `Text10` = ?, `Text11` = ?, `Text12` = ?, `Text13` = ?, `Text14` = ?, `Text15` = ?, `Text16` = ?, `Version` = ?, `Text17` = ?, `Text18` = ?, `Text19` = ?, `Text20` = ?, `Text21` = ?, `Text22` = ?, `Text23` = ?, `Text24` = ?, `Text25` = ?, `Text26` = ?, `Text27` = ?, `Text28` = ?, `Text29` = ?, `Text30` = ?, `Text31` = ?, `Text32` = ? WHERE ((`LabelID` = ?))";
		_adapter.UpdateCommand.CommandType = CommandType.Text;
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("LabelID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Width", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Width", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Height", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Height", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Sort", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Sort", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Name", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Current, sourceColumnNullMapping: false, null));
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
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Version", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Version", DataRowVersion.Current, sourceColumnNullMapping: false, null));
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
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_LabelID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private void InitConnection()
	{
		_connection = new OleDbConnection();
		_connection.ConnectionString = Settings.Default.ECSConnectionString;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private void InitCommandCollection()
	{
		_commandCollection = new OleDbCommand[1];
		_commandCollection[0] = new OleDbCommand();
		_commandCollection[0].Connection = Connection;
		_commandCollection[0].CommandText = "SELECT LabelID, Width, Height, Sort, Name, Text1, Text2, Text3, Text4, Text5, Text6, Text7, \r\n      Text8, Text9, Text10, Text11, Text12, Text13, Text14, Text15, Text16, Version, Text17, \r\n      Text18, Text19, Text20, Text21, Text22, Text23, Text24, Text25, Text26, Text27, \r\n      Text28, Text29, Text30, Text31, Text32\r\nFROM Label\r\nORDER BY LabelID";
		_commandCollection[0].CommandType = CommandType.Text;
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DataObjectMethod(DataObjectMethodType.Fill, true)]
	public virtual int Fill(ECSDataSet.LabelDataTable dataTable)
	{
		Adapter.SelectCommand = CommandCollection[0];
		if (ClearBeforeFill)
		{
			dataTable.Clear();
		}
		return Adapter.Fill(dataTable);
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(ECSDataSet.LabelDataTable dataTable)
	{
		return Adapter.Update(dataTable);
	}

	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Update(ECSDataSet dataSet)
	{
		return Adapter.Update(dataSet, "Label");
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Update(DataRow dataRow)
	{
		return Adapter.Update(new DataRow[1] { dataRow });
	}

	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Update(DataRow[] dataRows)
	{
		return Adapter.Update(dataRows);
	}
}
