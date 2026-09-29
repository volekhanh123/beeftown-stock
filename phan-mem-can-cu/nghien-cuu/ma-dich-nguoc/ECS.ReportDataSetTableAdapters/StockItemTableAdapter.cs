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

[HelpKeyword("vs.data.TableAdapter")]
[DesignerCategory("code")]
[ToolboxItem(true)]
[Designer("Microsoft.VSDesigner.DataSource.Design.TableAdapterDesigner, Microsoft.VSDesigner, Version=10.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a")]
[DataObject(true)]
public class StockItemTableAdapter : Component
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

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public StockItemTableAdapter()
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
		dataTableMapping.DataSetTable = "StockItem";
		dataTableMapping.ColumnMappings.Add("KID", "KID");
		dataTableMapping.ColumnMappings.Add("GID", "GID");
		dataTableMapping.ColumnMappings.Add("MAC", "MAC");
		dataTableMapping.ColumnMappings.Add("FID", "FID");
		dataTableMapping.ColumnMappings.Add("DateTime", "DateTime");
		dataTableMapping.ColumnMappings.Add("Price", "Price");
		dataTableMapping.ColumnMappings.Add("PLU", "PLU");
		dataTableMapping.ColumnMappings.Add("Amount", "Amount");
		dataTableMapping.ColumnMappings.Add("Unit", "Unit");
		dataTableMapping.ColumnMappings.Add("Type", "Type");
		dataTableMapping.ColumnMappings.Add("UnitPrice", "UnitPrice");
		dataTableMapping.ColumnMappings.Add("SubID", "SubID");
		_adapter.TableMappings.Add(dataTableMapping);
		_adapter.DeleteCommand = new OleDbCommand();
		_adapter.DeleteCommand.Connection = Connection;
		_adapter.DeleteCommand.CommandText = "DELETE FROM `StockItem` WHERE ((`KID` = ?))";
		_adapter.DeleteCommand.CommandType = CommandType.Text;
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_KID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "KID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand = new OleDbCommand();
		_adapter.InsertCommand.Connection = Connection;
		_adapter.InsertCommand.CommandText = "INSERT INTO `StockItem` (`KID`, `GID`, `MAC`, `FID`, `DateTime`, `Price`, `PLU`, `Amount`, `Unit`, `Type`, `UnitPrice`, `SubID`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
		_adapter.InsertCommand.CommandType = CommandType.Text;
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("KID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "KID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("GID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "GID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("MAC", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "MAC", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("FID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "FID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DateTime", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "DateTime", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Price", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Price", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PLU", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLU", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Amount", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Amount", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Unit", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Unit", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Type", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Type", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("UnitPrice", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "UnitPrice", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SubID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SubID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand = new OleDbCommand();
		_adapter.UpdateCommand.Connection = Connection;
		_adapter.UpdateCommand.CommandText = "UPDATE `StockItem` SET `KID` = ?, `GID` = ?, `MAC` = ?, `FID` = ?, `DateTime` = ?, `Price` = ?, `PLU` = ?, `Amount` = ?, `Unit` = ?, `Type` = ?, `UnitPrice` = ?, `SubID` = ? WHERE ((`KID` = ?))";
		_adapter.UpdateCommand.CommandType = CommandType.Text;
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("KID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "KID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("GID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "GID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("MAC", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "MAC", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("FID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "FID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DateTime", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "DateTime", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Price", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Price", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PLU", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLU", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Amount", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Amount", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Unit", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Unit", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Type", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Type", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("UnitPrice", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "UnitPrice", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SubID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SubID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_KID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "KID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private void InitConnection()
	{
		_connection = new OleDbConnection();
		_connection.ConnectionString = Settings.Default.ReportConnectionString;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private void InitCommandCollection()
	{
		_commandCollection = new OleDbCommand[7];
		_commandCollection[0] = new OleDbCommand();
		_commandCollection[0].Connection = Connection;
		_commandCollection[0].CommandText = "SELECT KID, GID, MAC, FID, [DateTime], Price, PLU, Amount, Unit, Type, UnitPrice, \r\n      SubID\r\nFROM StockItem";
		_commandCollection[0].CommandType = CommandType.Text;
		_commandCollection[1] = new OleDbCommand();
		_commandCollection[1].Connection = Connection;
		_commandCollection[1].CommandText = "DELETE FROM `StockItem` WHERE (`DateTime` >= ?)";
		_commandCollection[1].CommandType = CommandType.Text;
		_commandCollection[1].Parameters.Add(new OleDbParameter("DateTime", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "DateTime", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_commandCollection[2] = new OleDbCommand();
		_commandCollection[2].Connection = Connection;
		_commandCollection[2].CommandText = "DELETE FROM `StockItem` WHERE (`DateTime` < ?)";
		_commandCollection[2].CommandType = CommandType.Text;
		_commandCollection[2].Parameters.Add(new OleDbParameter("DateTime", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "DateTime", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_commandCollection[3] = new OleDbCommand();
		_commandCollection[3].Connection = Connection;
		_commandCollection[3].CommandText = "DELETE FROM `StockItem`";
		_commandCollection[3].CommandType = CommandType.Text;
		_commandCollection[4] = new OleDbCommand();
		_commandCollection[4].Connection = Connection;
		_commandCollection[4].CommandText = "SELECT max(DateTime) FROM StockItem";
		_commandCollection[4].CommandType = CommandType.Text;
		_commandCollection[5] = new OleDbCommand();
		_commandCollection[5].Connection = Connection;
		_commandCollection[5].CommandText = "SELECT min(DateTime) FROM StockItem";
		_commandCollection[5].CommandType = CommandType.Text;
		_commandCollection[6] = new OleDbCommand();
		_commandCollection[6].Connection = Connection;
		_commandCollection[6].CommandText = "SELECT TOP 1024 Amount, [DateTime], FID, GID, KID, MAC, PLU, Price, SubID, Type, Unit, \r\n      UnitPrice\r\nFROM StockItem\r\nORDER BY KID DESC";
		_commandCollection[6].CommandType = CommandType.Text;
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[DataObjectMethod(DataObjectMethodType.Fill, true)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Fill(ReportDataSet.StockItemDataTable dataTable)
	{
		Adapter.SelectCommand = CommandCollection[0];
		if (ClearBeforeFill)
		{
			dataTable.Clear();
		}
		return Adapter.Fill(dataTable);
	}

	[DebuggerNonUserCode]
	[DataObjectMethod(DataObjectMethodType.Fill, false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int FillPart(ReportDataSet.StockItemDataTable dataTable)
	{
		Adapter.SelectCommand = CommandCollection[6];
		if (ClearBeforeFill)
		{
			dataTable.Clear();
		}
		return Adapter.Fill(dataTable);
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(ReportDataSet.StockItemDataTable dataTable)
	{
		return Adapter.Update(dataTable);
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	public virtual int Update(ReportDataSet dataSet)
	{
		return Adapter.Update(dataSet, "StockItem");
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
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
	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Delete(int? Original_KID)
	{
		if (Original_KID.HasValue)
		{
			Adapter.DeleteCommand.Parameters[0].Value = Original_KID.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[0].Value = DBNull.Value;
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
	[HelpKeyword("vs.data.TableAdapter")]
	[DataObjectMethod(DataObjectMethodType.Insert, true)]
	[DebuggerNonUserCode]
	public virtual int Insert(int? KID, int? GID, string MAC, int? FID, DateTime? DateTime, decimal? Price, int? PLU, decimal? Amount, int? Unit, int? Type, decimal? UnitPrice, int? SubID)
	{
		if (KID.HasValue)
		{
			Adapter.InsertCommand.Parameters[0].Value = KID.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[0].Value = DBNull.Value;
		}
		if (GID.HasValue)
		{
			Adapter.InsertCommand.Parameters[1].Value = GID.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[1].Value = DBNull.Value;
		}
		if (MAC == null)
		{
			Adapter.InsertCommand.Parameters[2].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[2].Value = MAC;
		}
		if (FID.HasValue)
		{
			Adapter.InsertCommand.Parameters[3].Value = FID.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[3].Value = DBNull.Value;
		}
		if (DateTime.HasValue)
		{
			Adapter.InsertCommand.Parameters[4].Value = DateTime.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[4].Value = DBNull.Value;
		}
		if (Price.HasValue)
		{
			Adapter.InsertCommand.Parameters[5].Value = Price.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[5].Value = DBNull.Value;
		}
		if (PLU.HasValue)
		{
			Adapter.InsertCommand.Parameters[6].Value = PLU.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[6].Value = DBNull.Value;
		}
		if (Amount.HasValue)
		{
			Adapter.InsertCommand.Parameters[7].Value = Amount.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[7].Value = DBNull.Value;
		}
		if (Unit.HasValue)
		{
			Adapter.InsertCommand.Parameters[8].Value = Unit.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[8].Value = DBNull.Value;
		}
		if (Type.HasValue)
		{
			Adapter.InsertCommand.Parameters[9].Value = Type.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[9].Value = DBNull.Value;
		}
		if (UnitPrice.HasValue)
		{
			Adapter.InsertCommand.Parameters[10].Value = UnitPrice.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[10].Value = DBNull.Value;
		}
		if (SubID.HasValue)
		{
			Adapter.InsertCommand.Parameters[11].Value = SubID.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[11].Value = DBNull.Value;
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

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	[DataObjectMethod(DataObjectMethodType.Update, true)]
	[DebuggerNonUserCode]
	public virtual int Update(int? KID, int? GID, string MAC, int? FID, DateTime? DateTime, decimal? Price, int? PLU, decimal? Amount, int? Unit, int? Type, decimal? UnitPrice, int? SubID, int? Original_KID)
	{
		if (KID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[0].Value = KID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[0].Value = DBNull.Value;
		}
		if (GID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[1].Value = GID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[1].Value = DBNull.Value;
		}
		if (MAC == null)
		{
			Adapter.UpdateCommand.Parameters[2].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[2].Value = MAC;
		}
		if (FID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[3].Value = FID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[3].Value = DBNull.Value;
		}
		if (DateTime.HasValue)
		{
			Adapter.UpdateCommand.Parameters[4].Value = DateTime.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[4].Value = DBNull.Value;
		}
		if (Price.HasValue)
		{
			Adapter.UpdateCommand.Parameters[5].Value = Price.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[5].Value = DBNull.Value;
		}
		if (PLU.HasValue)
		{
			Adapter.UpdateCommand.Parameters[6].Value = PLU.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[6].Value = DBNull.Value;
		}
		if (Amount.HasValue)
		{
			Adapter.UpdateCommand.Parameters[7].Value = Amount.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[7].Value = DBNull.Value;
		}
		if (Unit.HasValue)
		{
			Adapter.UpdateCommand.Parameters[8].Value = Unit.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[8].Value = DBNull.Value;
		}
		if (Type.HasValue)
		{
			Adapter.UpdateCommand.Parameters[9].Value = Type.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[9].Value = DBNull.Value;
		}
		if (UnitPrice.HasValue)
		{
			Adapter.UpdateCommand.Parameters[10].Value = UnitPrice.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[10].Value = DBNull.Value;
		}
		if (SubID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[11].Value = SubID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[11].Value = DBNull.Value;
		}
		if (Original_KID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[12].Value = Original_KID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[12].Value = DBNull.Value;
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

	[DebuggerNonUserCode]
	[DataObjectMethod(DataObjectMethodType.Update, true)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(int? GID, string MAC, int? FID, DateTime? DateTime, decimal? Price, int? PLU, decimal? Amount, int? Unit, int? Type, decimal? UnitPrice, int? SubID, int? Original_KID)
	{
		return Update(Original_KID, GID, MAC, FID, DateTime, Price, PLU, Amount, Unit, Type, UnitPrice, SubID, Original_KID);
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[DataObjectMethod(DataObjectMethodType.Delete, false)]
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

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	[DataObjectMethod(DataObjectMethodType.Delete, false)]
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

	[HelpKeyword("vs.data.TableAdapter")]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public virtual DateTime? DT_Max()
	{
		OleDbCommand oleDbCommand = CommandCollection[4];
		ConnectionState state = oleDbCommand.Connection.State;
		if ((oleDbCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			oleDbCommand.Connection.Open();
		}
		object obj;
		try
		{
			obj = oleDbCommand.ExecuteScalar();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				oleDbCommand.Connection.Close();
			}
		}
		if (obj == null || obj.GetType() == typeof(DBNull))
		{
			return null;
		}
		return (DateTime)obj;
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public virtual DateTime? DT_Min()
	{
		OleDbCommand oleDbCommand = CommandCollection[5];
		ConnectionState state = oleDbCommand.Connection.State;
		if ((oleDbCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			oleDbCommand.Connection.Open();
		}
		object obj;
		try
		{
			obj = oleDbCommand.ExecuteScalar();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				oleDbCommand.Connection.Close();
			}
		}
		if (obj == null || obj.GetType() == typeof(DBNull))
		{
			return null;
		}
		return (DateTime)obj;
	}
}
