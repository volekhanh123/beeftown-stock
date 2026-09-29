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
[DataObject(true)]
[Designer("Microsoft.VSDesigner.DataSource.Design.TableAdapterDesigner, Microsoft.VSDesigner, Version=10.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a")]
public class StockTableAdapter : Component
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
	public StockTableAdapter()
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
		dataTableMapping.DataSetTable = "Stock";
		dataTableMapping.ColumnMappings.Add("GID", "GID");
		dataTableMapping.ColumnMappings.Add("PLU", "PLU");
		dataTableMapping.ColumnMappings.Add("STakingTime", "STakingTime");
		dataTableMapping.ColumnMappings.Add("Amount", "Amount");
		dataTableMapping.ColumnMappings.Add("Unit", "Unit");
		dataTableMapping.ColumnMappings.Add("In_Amount", "In_Amount");
		dataTableMapping.ColumnMappings.Add("Spoilage", "Spoilage");
		dataTableMapping.ColumnMappings.Add("AmountSP", "AmountSP");
		dataTableMapping.ColumnMappings.Add("UnitSP", "UnitSP");
		dataTableMapping.ColumnMappings.Add("In_AmountSP", "In_AmountSP");
		dataTableMapping.ColumnMappings.Add("SpoilageSP", "SpoilageSP");
		dataTableMapping.ColumnMappings.Add("In_Money", "In_Money");
		dataTableMapping.ColumnMappings.Add("Sped", "Sped");
		dataTableMapping.ColumnMappings.Add("SafetyStock", "SafetyStock");
		dataTableMapping.ColumnMappings.Add("LowStock", "LowStock");
		dataTableMapping.ColumnMappings.Add("Order", "Order");
		dataTableMapping.ColumnMappings.Add("KID", "KID");
		dataTableMapping.ColumnMappings.Add("KID_Time", "KID_Time");
		_adapter.TableMappings.Add(dataTableMapping);
		_adapter.DeleteCommand = new OleDbCommand();
		_adapter.DeleteCommand.Connection = Connection;
		_adapter.DeleteCommand.CommandText = "DELETE FROM `Stock` WHERE ((`GID` = ?) AND (`PLU` = ?))";
		_adapter.DeleteCommand.CommandType = CommandType.Text;
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_GID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "GID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_PLU", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLU", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand = new OleDbCommand();
		_adapter.InsertCommand.Connection = Connection;
		_adapter.InsertCommand.CommandText = "INSERT INTO `Stock` (`GID`, `PLU`, `STakingTime`, `Amount`, `Unit`, `In_Amount`, `Spoilage`, `AmountSP`, `UnitSP`, `In_AmountSP`, `SpoilageSP`, `In_Money`, `Sped`, `SafetyStock`, `LowStock`, `Order`, `KID`, `KID_Time`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
		_adapter.InsertCommand.CommandType = CommandType.Text;
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("GID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "GID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PLU", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLU", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("STakingTime", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "STakingTime", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Amount", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Amount", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Unit", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Unit", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("In_Amount", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "In_Amount", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Spoilage", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Spoilage", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("AmountSP", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "AmountSP", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("UnitSP", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "UnitSP", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("In_AmountSP", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "In_AmountSP", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SpoilageSP", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "SpoilageSP", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("In_Money", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "In_Money", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Sped", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "Sped", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SafetyStock", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "SafetyStock", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("LowStock", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "LowStock", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Order", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Order", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("KID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "KID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("KID_Time", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "KID_Time", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand = new OleDbCommand();
		_adapter.UpdateCommand.Connection = Connection;
		_adapter.UpdateCommand.CommandText = "UPDATE `Stock` SET `GID` = ?, `PLU` = ?, `STakingTime` = ?, `Amount` = ?, `Unit` = ?, `In_Amount` = ?, `Spoilage` = ?, `AmountSP` = ?, `UnitSP` = ?, `In_AmountSP` = ?, `SpoilageSP` = ?, `In_Money` = ?, `Sped` = ?, `SafetyStock` = ?, `LowStock` = ?, `Order` = ?, `KID` = ?, `KID_Time` = ? WHERE ((`GID` = ?) AND (`PLU` = ?))";
		_adapter.UpdateCommand.CommandType = CommandType.Text;
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("GID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "GID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PLU", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLU", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("STakingTime", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "STakingTime", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Amount", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Amount", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Unit", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Unit", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("In_Amount", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "In_Amount", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Spoilage", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Spoilage", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("AmountSP", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "AmountSP", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("UnitSP", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "UnitSP", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("In_AmountSP", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "In_AmountSP", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SpoilageSP", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "SpoilageSP", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("In_Money", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "In_Money", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Sped", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "Sped", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SafetyStock", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "SafetyStock", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("LowStock", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "LowStock", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Order", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Order", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("KID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "KID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("KID_Time", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "KID_Time", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_GID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "GID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_PLU", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLU", DataRowVersion.Original, sourceColumnNullMapping: false, null));
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
		_commandCollection = new OleDbCommand[3];
		_commandCollection[0] = new OleDbCommand();
		_commandCollection[0].Connection = Connection;
		_commandCollection[0].CommandText = "SELECT GID, PLU, STakingTime, Amount, Unit, In_Amount, Spoilage, AmountSP, UnitSP, \r\n      In_AmountSP, SpoilageSP, In_Money, Sped, SafetyStock, LowStock, [Order], KID, \r\n      KID_Time\r\nFROM Stock";
		_commandCollection[0].CommandType = CommandType.Text;
		_commandCollection[1] = new OleDbCommand();
		_commandCollection[1].Connection = Connection;
		_commandCollection[1].CommandText = "DELETE FROM `Stock`";
		_commandCollection[1].CommandType = CommandType.Text;
		_commandCollection[2] = new OleDbCommand();
		_commandCollection[2].Connection = Connection;
		_commandCollection[2].CommandText = "SELECT TOP 1024 GID, PLU, STakingTime, Amount, Unit, In_Amount, Spoilage, AmountSP, \r\n      UnitSP, In_AmountSP, SpoilageSP, In_Money, Sped, SafetyStock, LowStock, [Order], \r\n      KID, KID_Time\r\nFROM Stock\r\nORDER BY KID DESC";
		_commandCollection[2].CommandType = CommandType.Text;
	}

	[DataObjectMethod(DataObjectMethodType.Fill, true)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	public virtual int Fill(ReportDataSet.StockDataTable dataTable)
	{
		Adapter.SelectCommand = CommandCollection[0];
		if (ClearBeforeFill)
		{
			dataTable.Clear();
		}
		return Adapter.Fill(dataTable);
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	[DataObjectMethod(DataObjectMethodType.Fill, false)]
	[DebuggerNonUserCode]
	public virtual int FillPart(ReportDataSet.StockDataTable dataTable)
	{
		Adapter.SelectCommand = CommandCollection[2];
		if (ClearBeforeFill)
		{
			dataTable.Clear();
		}
		return Adapter.Fill(dataTable);
	}

	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Update(ReportDataSet.StockDataTable dataTable)
	{
		return Adapter.Update(dataTable);
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(ReportDataSet dataSet)
	{
		return Adapter.Update(dataSet, "Stock");
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

	[DataObjectMethod(DataObjectMethodType.Delete, true)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Delete(int? Original_GID, int? Original_PLU)
	{
		if (Original_GID.HasValue)
		{
			Adapter.DeleteCommand.Parameters[0].Value = Original_GID.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[0].Value = DBNull.Value;
		}
		if (Original_PLU.HasValue)
		{
			Adapter.DeleteCommand.Parameters[1].Value = Original_PLU.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[1].Value = DBNull.Value;
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
	[DataObjectMethod(DataObjectMethodType.Insert, true)]
	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	public virtual int Insert(int? GID, int? PLU, DateTime? STakingTime, decimal? Amount, int? Unit, decimal? In_Amount, decimal? Spoilage, decimal? AmountSP, int? UnitSP, decimal? In_AmountSP, decimal? SpoilageSP, decimal? In_Money, bool Sped, decimal? SafetyStock, bool LowStock, decimal? Order, int? KID, DateTime? KID_Time)
	{
		if (GID.HasValue)
		{
			Adapter.InsertCommand.Parameters[0].Value = GID.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[0].Value = DBNull.Value;
		}
		if (PLU.HasValue)
		{
			Adapter.InsertCommand.Parameters[1].Value = PLU.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[1].Value = DBNull.Value;
		}
		if (STakingTime.HasValue)
		{
			Adapter.InsertCommand.Parameters[2].Value = STakingTime.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[2].Value = DBNull.Value;
		}
		if (Amount.HasValue)
		{
			Adapter.InsertCommand.Parameters[3].Value = Amount.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[3].Value = DBNull.Value;
		}
		if (Unit.HasValue)
		{
			Adapter.InsertCommand.Parameters[4].Value = Unit.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[4].Value = DBNull.Value;
		}
		if (In_Amount.HasValue)
		{
			Adapter.InsertCommand.Parameters[5].Value = In_Amount.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[5].Value = DBNull.Value;
		}
		if (Spoilage.HasValue)
		{
			Adapter.InsertCommand.Parameters[6].Value = Spoilage.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[6].Value = DBNull.Value;
		}
		if (AmountSP.HasValue)
		{
			Adapter.InsertCommand.Parameters[7].Value = AmountSP.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[7].Value = DBNull.Value;
		}
		if (UnitSP.HasValue)
		{
			Adapter.InsertCommand.Parameters[8].Value = UnitSP.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[8].Value = DBNull.Value;
		}
		if (In_AmountSP.HasValue)
		{
			Adapter.InsertCommand.Parameters[9].Value = In_AmountSP.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[9].Value = DBNull.Value;
		}
		if (SpoilageSP.HasValue)
		{
			Adapter.InsertCommand.Parameters[10].Value = SpoilageSP.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[10].Value = DBNull.Value;
		}
		if (In_Money.HasValue)
		{
			Adapter.InsertCommand.Parameters[11].Value = In_Money.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[11].Value = DBNull.Value;
		}
		Adapter.InsertCommand.Parameters[12].Value = Sped;
		if (SafetyStock.HasValue)
		{
			Adapter.InsertCommand.Parameters[13].Value = SafetyStock.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[13].Value = DBNull.Value;
		}
		Adapter.InsertCommand.Parameters[14].Value = LowStock;
		if (Order.HasValue)
		{
			Adapter.InsertCommand.Parameters[15].Value = Order.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[15].Value = DBNull.Value;
		}
		if (KID.HasValue)
		{
			Adapter.InsertCommand.Parameters[16].Value = KID.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[16].Value = DBNull.Value;
		}
		if (KID_Time.HasValue)
		{
			Adapter.InsertCommand.Parameters[17].Value = KID_Time.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[17].Value = DBNull.Value;
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
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DataObjectMethod(DataObjectMethodType.Update, true)]
	[DebuggerNonUserCode]
	public virtual int Update(int? GID, int? PLU, DateTime? STakingTime, decimal? Amount, int? Unit, decimal? In_Amount, decimal? Spoilage, decimal? AmountSP, int? UnitSP, decimal? In_AmountSP, decimal? SpoilageSP, decimal? In_Money, bool Sped, decimal? SafetyStock, bool LowStock, decimal? Order, int? KID, DateTime? KID_Time, int? Original_GID, int? Original_PLU)
	{
		if (GID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[0].Value = GID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[0].Value = DBNull.Value;
		}
		if (PLU.HasValue)
		{
			Adapter.UpdateCommand.Parameters[1].Value = PLU.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[1].Value = DBNull.Value;
		}
		if (STakingTime.HasValue)
		{
			Adapter.UpdateCommand.Parameters[2].Value = STakingTime.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[2].Value = DBNull.Value;
		}
		if (Amount.HasValue)
		{
			Adapter.UpdateCommand.Parameters[3].Value = Amount.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[3].Value = DBNull.Value;
		}
		if (Unit.HasValue)
		{
			Adapter.UpdateCommand.Parameters[4].Value = Unit.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[4].Value = DBNull.Value;
		}
		if (In_Amount.HasValue)
		{
			Adapter.UpdateCommand.Parameters[5].Value = In_Amount.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[5].Value = DBNull.Value;
		}
		if (Spoilage.HasValue)
		{
			Adapter.UpdateCommand.Parameters[6].Value = Spoilage.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[6].Value = DBNull.Value;
		}
		if (AmountSP.HasValue)
		{
			Adapter.UpdateCommand.Parameters[7].Value = AmountSP.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[7].Value = DBNull.Value;
		}
		if (UnitSP.HasValue)
		{
			Adapter.UpdateCommand.Parameters[8].Value = UnitSP.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[8].Value = DBNull.Value;
		}
		if (In_AmountSP.HasValue)
		{
			Adapter.UpdateCommand.Parameters[9].Value = In_AmountSP.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[9].Value = DBNull.Value;
		}
		if (SpoilageSP.HasValue)
		{
			Adapter.UpdateCommand.Parameters[10].Value = SpoilageSP.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[10].Value = DBNull.Value;
		}
		if (In_Money.HasValue)
		{
			Adapter.UpdateCommand.Parameters[11].Value = In_Money.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[11].Value = DBNull.Value;
		}
		Adapter.UpdateCommand.Parameters[12].Value = Sped;
		if (SafetyStock.HasValue)
		{
			Adapter.UpdateCommand.Parameters[13].Value = SafetyStock.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[13].Value = DBNull.Value;
		}
		Adapter.UpdateCommand.Parameters[14].Value = LowStock;
		if (Order.HasValue)
		{
			Adapter.UpdateCommand.Parameters[15].Value = Order.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[15].Value = DBNull.Value;
		}
		if (KID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[16].Value = KID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[16].Value = DBNull.Value;
		}
		if (KID_Time.HasValue)
		{
			Adapter.UpdateCommand.Parameters[17].Value = KID_Time.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[17].Value = DBNull.Value;
		}
		if (Original_GID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[18].Value = Original_GID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[18].Value = DBNull.Value;
		}
		if (Original_PLU.HasValue)
		{
			Adapter.UpdateCommand.Parameters[19].Value = Original_PLU.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[19].Value = DBNull.Value;
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

	[DataObjectMethod(DataObjectMethodType.Update, true)]
	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Update(DateTime? STakingTime, decimal? Amount, int? Unit, decimal? In_Amount, decimal? Spoilage, decimal? AmountSP, int? UnitSP, decimal? In_AmountSP, decimal? SpoilageSP, decimal? In_Money, bool Sped, decimal? SafetyStock, bool LowStock, decimal? Order, int? KID, DateTime? KID_Time, int? Original_GID, int? Original_PLU)
	{
		return Update(Original_GID, Original_PLU, STakingTime, Amount, Unit, In_Amount, Spoilage, AmountSP, UnitSP, In_AmountSP, SpoilageSP, In_Money, Sped, SafetyStock, LowStock, Order, KID, KID_Time, Original_GID, Original_PLU);
	}

	[DataObjectMethod(DataObjectMethodType.Delete, false)]
	[HelpKeyword("vs.data.TableAdapter")]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public virtual int DeleteAll()
	{
		OleDbCommand oleDbCommand = CommandCollection[1];
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
