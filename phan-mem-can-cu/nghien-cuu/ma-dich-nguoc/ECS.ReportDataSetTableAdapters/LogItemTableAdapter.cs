using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.ComponentModel.Design;
using System.Data;
using System.Data.Common;
using System.Data.OleDb;
using System.Diagnostics;
using ECS.Properties;

namespace ECS.ReportDataSetTableAdapters;

[Designer("Microsoft.VSDesigner.DataSource.Design.TableAdapterDesigner, Microsoft.VSDesigner, Version=10.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a")]
[HelpKeyword("vs.data.TableAdapter")]
[DesignerCategory("code")]
[DataObject(true)]
[ToolboxItem(true)]
public class LogItemTableAdapter : Component
{
	private OleDbDataAdapter _adapter;

	private OleDbConnection _connection;

	private OleDbCommand[] _commandCollection;

	private bool _clearBeforeFill;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
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

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
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

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public LogItemTableAdapter()
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
		dataTableMapping.DataSetTable = "LogItem";
		dataTableMapping.ColumnMappings.Add("MAC", "MAC");
		dataTableMapping.ColumnMappings.Add("FID", "FID");
		dataTableMapping.ColumnMappings.Add("SubID", "SubID");
		dataTableMapping.ColumnMappings.Add("Price", "Price");
		dataTableMapping.ColumnMappings.Add("PLU", "PLU");
		dataTableMapping.ColumnMappings.Add("Class", "Class");
		dataTableMapping.ColumnMappings.Add("Dept", "Dept");
		dataTableMapping.ColumnMappings.Add("Cost", "Cost");
		dataTableMapping.ColumnMappings.Add("Amount", "Amount");
		dataTableMapping.ColumnMappings.Add("Unit", "Unit");
		dataTableMapping.ColumnMappings.Add("Type", "Type");
		dataTableMapping.ColumnMappings.Add("Tax", "Tax");
		dataTableMapping.ColumnMappings.Add("Text1", "Text1");
		dataTableMapping.ColumnMappings.Add("Text2", "Text2");
		dataTableMapping.ColumnMappings.Add("Text3", "Text3");
		dataTableMapping.ColumnMappings.Add("Text4", "Text4");
		dataTableMapping.ColumnMappings.Add("UnitPrice", "UnitPrice");
		dataTableMapping.ColumnMappings.Add("CoFID", "CoFID");
		dataTableMapping.ColumnMappings.Add("PLUName", "PLUName");
		dataTableMapping.ColumnMappings.Add("DateTime", "DateTime");
		_adapter.TableMappings.Add(dataTableMapping);
		_adapter.DeleteCommand = new OleDbCommand();
		_adapter.DeleteCommand.Connection = Connection;
		_adapter.DeleteCommand.CommandText = "DELETE FROM `LogItem` WHERE ((`MAC` = ?) AND (`FID` = ?) AND (`SubID` = ?))";
		_adapter.DeleteCommand.CommandType = CommandType.Text;
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_MAC", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "MAC", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_FID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "FID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_SubID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SubID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand = new OleDbCommand();
		_adapter.InsertCommand.Connection = Connection;
		_adapter.InsertCommand.CommandText = "INSERT INTO `LogItem` (`MAC`, `FID`, `SubID`, `Price`, `PLU`, `Class`, `Dept`, `Cost`, `Amount`, `Unit`, `Type`, `Tax`, `Text1`, `Text2`, `Text3`, `Text4`, `UnitPrice`, `CoFID`, `PLUName`, `DateTime`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
		_adapter.InsertCommand.CommandType = CommandType.Text;
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("MAC", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "MAC", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("FID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "FID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SubID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SubID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Price", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Price", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PLU", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLU", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Class", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Class", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Dept", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Dept", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Cost", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Cost", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Amount", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Amount", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Unit", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Unit", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Type", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Type", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Tax", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Tax", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text1", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text2", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text3", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text4", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("UnitPrice", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "UnitPrice", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("CoFID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "CoFID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PLUName", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "PLUName", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DateTime", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "DateTime", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand = new OleDbCommand();
		_adapter.UpdateCommand.Connection = Connection;
		_adapter.UpdateCommand.CommandText = "UPDATE `LogItem` SET `MAC` = ?, `FID` = ?, `SubID` = ?, `Price` = ?, `PLU` = ?, `Class` = ?, `Dept` = ?, `Cost` = ?, `Amount` = ?, `Unit` = ?, `Type` = ?, `Tax` = ?, `Text1` = ?, `Text2` = ?, `Text3` = ?, `Text4` = ?, `UnitPrice` = ?, `CoFID` = ?, `PLUName` = ?, `DateTime` = ? WHERE ((`MAC` = ?) AND (`FID` = ?) AND (`SubID` = ?))";
		_adapter.UpdateCommand.CommandType = CommandType.Text;
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("MAC", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "MAC", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("FID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "FID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SubID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SubID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Price", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Price", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PLU", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLU", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Class", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Class", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Dept", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Dept", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Cost", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Cost", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Amount", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Amount", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Unit", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Unit", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Type", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Type", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Tax", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Tax", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text1", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text2", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text3", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text4", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("UnitPrice", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "UnitPrice", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("CoFID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "CoFID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PLUName", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "PLUName", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DateTime", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "DateTime", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_MAC", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "MAC", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_FID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "FID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_SubID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SubID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private void InitConnection()
	{
		_connection = new OleDbConnection();
		_connection.ConnectionString = Settings.Default.ReportConnectionString;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private void InitCommandCollection()
	{
		_commandCollection = new OleDbCommand[5];
		_commandCollection[0] = new OleDbCommand();
		_commandCollection[0].Connection = Connection;
		_commandCollection[0].CommandText = "SELECT MAC, FID, SubID, Price, PLU, Class, Dept, Cost, Amount, Unit, Type, Tax, Text1, \r\n      Text2, Text3, Text4, UnitPrice, CoFID, PLUName, [DateTime]\r\nFROM LogItem";
		_commandCollection[0].CommandType = CommandType.Text;
		_commandCollection[1] = new OleDbCommand();
		_commandCollection[1].Connection = Connection;
		_commandCollection[1].CommandText = "DELETE FROM `LogItem` WHERE (`DateTime` >= ?)";
		_commandCollection[1].CommandType = CommandType.Text;
		_commandCollection[1].Parameters.Add(new OleDbParameter("DateTime", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "DateTime", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_commandCollection[2] = new OleDbCommand();
		_commandCollection[2].Connection = Connection;
		_commandCollection[2].CommandText = "DELETE FROM `LogItem` WHERE (`DateTime` < ?)";
		_commandCollection[2].CommandType = CommandType.Text;
		_commandCollection[2].Parameters.Add(new OleDbParameter("DateTime", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "DateTime", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_commandCollection[3] = new OleDbCommand();
		_commandCollection[3].Connection = Connection;
		_commandCollection[3].CommandText = "DELETE FROM `LogItem`";
		_commandCollection[3].CommandType = CommandType.Text;
		_commandCollection[4] = new OleDbCommand();
		_commandCollection[4].Connection = Connection;
		_commandCollection[4].CommandText = "SELECT TOP 10240 Amount, Class, CoFID, Cost, [DateTime], Dept, FID, MAC, PLU, PLUName, Price, SubID, Tax, Text1, Text2, Text3, Text4, Type, Unit, UnitPrice FROM LogItem WHERE (MAC = CheckMAC)";
		_commandCollection[4].CommandType = CommandType.Text;
		_commandCollection[4].Parameters.Add(new OleDbParameter("CheckMAC", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, null, DataRowVersion.Current, sourceColumnNullMapping: false, null));
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[DataObjectMethod(DataObjectMethodType.Fill, true)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Fill(ReportDataSet.LogItemDataTable dataTable)
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
	[DataObjectMethod(DataObjectMethodType.Fill, false)]
	public virtual int FillPartByMAC(ReportDataSet.LogItemDataTable dataTable, string CheckMAC)
	{
		Adapter.SelectCommand = CommandCollection[4];
		if (CheckMAC == null)
		{
			throw new ArgumentNullException("CheckMAC");
		}
		Adapter.SelectCommand.Parameters[0].Value = CheckMAC;
		if (ClearBeforeFill)
		{
			dataTable.Clear();
		}
		return Adapter.Fill(dataTable);
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Update(ReportDataSet.LogItemDataTable dataTable)
	{
		return Adapter.Update(dataTable);
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	public virtual int Update(ReportDataSet dataSet)
	{
		return Adapter.Update(dataSet, "LogItem");
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(DataRow dataRow)
	{
		return Adapter.Update(new DataRow[1] { dataRow });
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public virtual int Update(DataRow[] dataRows)
	{
		return Adapter.Update(dataRows);
	}

	[DataObjectMethod(DataObjectMethodType.Delete, true)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	public virtual int Delete(string Original_MAC, int? Original_FID, int? Original_SubID)
	{
		if (Original_MAC == null)
		{
			Adapter.DeleteCommand.Parameters[0].Value = DBNull.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[0].Value = Original_MAC;
		}
		if (Original_FID.HasValue)
		{
			Adapter.DeleteCommand.Parameters[1].Value = Original_FID.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[1].Value = DBNull.Value;
		}
		if (Original_SubID.HasValue)
		{
			Adapter.DeleteCommand.Parameters[2].Value = Original_SubID.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[2].Value = DBNull.Value;
		}
		ConnectionState state = Adapter.DeleteCommand.Connection.State;
		if ((Adapter.DeleteCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			Adapter.DeleteCommand.Connection.Open();
		}
		try
		{
			return Adapter.DeleteCommand.ExecuteNonQuery();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				Adapter.DeleteCommand.Connection.Close();
			}
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	[DataObjectMethod(DataObjectMethodType.Insert, true)]
	public virtual int Insert(string MAC, int? FID, int? SubID, decimal? Price, int? PLU, int? Class, int? Dept, decimal? Cost, decimal? Amount, int? Unit, int? Type, decimal? Tax, string Text1, string Text2, string Text3, string Text4, decimal? UnitPrice, int? CoFID, string PLUName, DateTime? DateTime)
	{
		if (MAC == null)
		{
			Adapter.InsertCommand.Parameters[0].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[0].Value = MAC;
		}
		if (FID.HasValue)
		{
			Adapter.InsertCommand.Parameters[1].Value = FID.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[1].Value = DBNull.Value;
		}
		if (SubID.HasValue)
		{
			Adapter.InsertCommand.Parameters[2].Value = SubID.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[2].Value = DBNull.Value;
		}
		if (Price.HasValue)
		{
			Adapter.InsertCommand.Parameters[3].Value = Price.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[3].Value = DBNull.Value;
		}
		if (PLU.HasValue)
		{
			Adapter.InsertCommand.Parameters[4].Value = PLU.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[4].Value = DBNull.Value;
		}
		if (Class.HasValue)
		{
			Adapter.InsertCommand.Parameters[5].Value = Class.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[5].Value = DBNull.Value;
		}
		if (Dept.HasValue)
		{
			Adapter.InsertCommand.Parameters[6].Value = Dept.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[6].Value = DBNull.Value;
		}
		if (Cost.HasValue)
		{
			Adapter.InsertCommand.Parameters[7].Value = Cost.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[7].Value = DBNull.Value;
		}
		if (Amount.HasValue)
		{
			Adapter.InsertCommand.Parameters[8].Value = Amount.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[8].Value = DBNull.Value;
		}
		if (Unit.HasValue)
		{
			Adapter.InsertCommand.Parameters[9].Value = Unit.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[9].Value = DBNull.Value;
		}
		if (Type.HasValue)
		{
			Adapter.InsertCommand.Parameters[10].Value = Type.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[10].Value = DBNull.Value;
		}
		if (Tax.HasValue)
		{
			Adapter.InsertCommand.Parameters[11].Value = Tax.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[11].Value = DBNull.Value;
		}
		if (Text1 == null)
		{
			Adapter.InsertCommand.Parameters[12].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[12].Value = Text1;
		}
		if (Text2 == null)
		{
			Adapter.InsertCommand.Parameters[13].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[13].Value = Text2;
		}
		if (Text3 == null)
		{
			Adapter.InsertCommand.Parameters[14].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[14].Value = Text3;
		}
		if (Text4 == null)
		{
			Adapter.InsertCommand.Parameters[15].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[15].Value = Text4;
		}
		if (UnitPrice.HasValue)
		{
			Adapter.InsertCommand.Parameters[16].Value = UnitPrice.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[16].Value = DBNull.Value;
		}
		if (CoFID.HasValue)
		{
			Adapter.InsertCommand.Parameters[17].Value = CoFID.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[17].Value = DBNull.Value;
		}
		if (PLUName == null)
		{
			Adapter.InsertCommand.Parameters[18].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[18].Value = PLUName;
		}
		if (DateTime.HasValue)
		{
			Adapter.InsertCommand.Parameters[19].Value = DateTime.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[19].Value = DBNull.Value;
		}
		ConnectionState state = Adapter.InsertCommand.Connection.State;
		if ((Adapter.InsertCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			Adapter.InsertCommand.Connection.Open();
		}
		try
		{
			return Adapter.InsertCommand.ExecuteNonQuery();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				Adapter.InsertCommand.Connection.Close();
			}
		}
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[DataObjectMethod(DataObjectMethodType.Update, true)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Update(string MAC, int? FID, int? SubID, decimal? Price, int? PLU, int? Class, int? Dept, decimal? Cost, decimal? Amount, int? Unit, int? Type, decimal? Tax, string Text1, string Text2, string Text3, string Text4, decimal? UnitPrice, int? CoFID, string PLUName, DateTime? DateTime, string Original_MAC, int? Original_FID, int? Original_SubID)
	{
		if (MAC == null)
		{
			Adapter.UpdateCommand.Parameters[0].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[0].Value = MAC;
		}
		if (FID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[1].Value = FID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[1].Value = DBNull.Value;
		}
		if (SubID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[2].Value = SubID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[2].Value = DBNull.Value;
		}
		if (Price.HasValue)
		{
			Adapter.UpdateCommand.Parameters[3].Value = Price.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[3].Value = DBNull.Value;
		}
		if (PLU.HasValue)
		{
			Adapter.UpdateCommand.Parameters[4].Value = PLU.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[4].Value = DBNull.Value;
		}
		if (Class.HasValue)
		{
			Adapter.UpdateCommand.Parameters[5].Value = Class.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[5].Value = DBNull.Value;
		}
		if (Dept.HasValue)
		{
			Adapter.UpdateCommand.Parameters[6].Value = Dept.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[6].Value = DBNull.Value;
		}
		if (Cost.HasValue)
		{
			Adapter.UpdateCommand.Parameters[7].Value = Cost.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[7].Value = DBNull.Value;
		}
		if (Amount.HasValue)
		{
			Adapter.UpdateCommand.Parameters[8].Value = Amount.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[8].Value = DBNull.Value;
		}
		if (Unit.HasValue)
		{
			Adapter.UpdateCommand.Parameters[9].Value = Unit.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[9].Value = DBNull.Value;
		}
		if (Type.HasValue)
		{
			Adapter.UpdateCommand.Parameters[10].Value = Type.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[10].Value = DBNull.Value;
		}
		if (Tax.HasValue)
		{
			Adapter.UpdateCommand.Parameters[11].Value = Tax.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[11].Value = DBNull.Value;
		}
		if (Text1 == null)
		{
			Adapter.UpdateCommand.Parameters[12].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[12].Value = Text1;
		}
		if (Text2 == null)
		{
			Adapter.UpdateCommand.Parameters[13].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[13].Value = Text2;
		}
		if (Text3 == null)
		{
			Adapter.UpdateCommand.Parameters[14].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[14].Value = Text3;
		}
		if (Text4 == null)
		{
			Adapter.UpdateCommand.Parameters[15].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[15].Value = Text4;
		}
		if (UnitPrice.HasValue)
		{
			Adapter.UpdateCommand.Parameters[16].Value = UnitPrice.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[16].Value = DBNull.Value;
		}
		if (CoFID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[17].Value = CoFID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[17].Value = DBNull.Value;
		}
		if (PLUName == null)
		{
			Adapter.UpdateCommand.Parameters[18].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[18].Value = PLUName;
		}
		if (DateTime.HasValue)
		{
			Adapter.UpdateCommand.Parameters[19].Value = DateTime.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[19].Value = DBNull.Value;
		}
		if (Original_MAC == null)
		{
			Adapter.UpdateCommand.Parameters[20].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[20].Value = Original_MAC;
		}
		if (Original_FID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[21].Value = Original_FID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[21].Value = DBNull.Value;
		}
		if (Original_SubID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[22].Value = Original_SubID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[22].Value = DBNull.Value;
		}
		ConnectionState state = Adapter.UpdateCommand.Connection.State;
		if ((Adapter.UpdateCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			Adapter.UpdateCommand.Connection.Open();
		}
		try
		{
			return Adapter.UpdateCommand.ExecuteNonQuery();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				Adapter.UpdateCommand.Connection.Close();
			}
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[DataObjectMethod(DataObjectMethodType.Update, true)]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(decimal? Price, int? PLU, int? Class, int? Dept, decimal? Cost, decimal? Amount, int? Unit, int? Type, decimal? Tax, string Text1, string Text2, string Text3, string Text4, decimal? UnitPrice, int? CoFID, string PLUName, DateTime? DateTime, string Original_MAC, int? Original_FID, int? Original_SubID)
	{
		return Update(Original_MAC, Original_FID, Original_SubID, Price, PLU, Class, Dept, Cost, Amount, Unit, Type, Tax, Text1, Text2, Text3, Text4, UnitPrice, CoFID, PLUName, DateTime, Original_MAC, Original_FID, Original_SubID);
	}

	[DebuggerNonUserCode]
	[DataObjectMethod(DataObjectMethodType.Delete, false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Delete_DT_BigE(DateTime? DateTime)
	{
		OleDbCommand oleDbCommand = CommandCollection[1];
		if (DateTime.HasValue)
		{
			oleDbCommand.Parameters[0].Value = DateTime.Value;
		}
		else
		{
			oleDbCommand.Parameters[0].Value = DBNull.Value;
		}
		ConnectionState state = oleDbCommand.Connection.State;
		if ((oleDbCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			oleDbCommand.Connection.Open();
		}
		try
		{
			return oleDbCommand.ExecuteNonQuery();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				oleDbCommand.Connection.Close();
			}
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DataObjectMethod(DataObjectMethodType.Delete, false)]
	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Delete_DT_Small(DateTime? DateTime)
	{
		OleDbCommand oleDbCommand = CommandCollection[2];
		if (DateTime.HasValue)
		{
			oleDbCommand.Parameters[0].Value = DateTime.Value;
		}
		else
		{
			oleDbCommand.Parameters[0].Value = DBNull.Value;
		}
		ConnectionState state = oleDbCommand.Connection.State;
		if ((oleDbCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			oleDbCommand.Connection.Open();
		}
		try
		{
			return oleDbCommand.ExecuteNonQuery();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				oleDbCommand.Connection.Close();
			}
		}
	}

	[DataObjectMethod(DataObjectMethodType.Delete, false)]
	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int DeleteAll()
	{
		OleDbCommand oleDbCommand = CommandCollection[3];
		ConnectionState state = oleDbCommand.Connection.State;
		if ((oleDbCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			oleDbCommand.Connection.Open();
		}
		try
		{
			return oleDbCommand.ExecuteNonQuery();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				oleDbCommand.Connection.Close();
			}
		}
	}
}
