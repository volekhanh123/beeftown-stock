using System.CodeDom.Compiler;
using System.ComponentModel;
using System.ComponentModel.Design;
using System.Data;
using System.Data.Common;
using System.Data.OleDb;
using System.Diagnostics;
using ECS.Properties;

namespace ECS.ECSDataSetTableAdapters;

[Designer("Microsoft.VSDesigner.DataSource.Design.TableAdapterDesigner, Microsoft.VSDesigner, Version=10.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a")]
[HelpKeyword("vs.data.TableAdapter")]
[DesignerCategory("code")]
[ToolboxItem(true)]
[DataObject(true)]
public class PLUTableAdapter : Component
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

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
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

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public PLUTableAdapter()
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
		dataTableMapping.DataSetTable = "PLU";
		dataTableMapping.ColumnMappings.Add("PLUID", "PLUID");
		dataTableMapping.ColumnMappings.Add("Remark", "Remark");
		dataTableMapping.ColumnMappings.Add("Index", "Index");
		dataTableMapping.ColumnMappings.Add("UnitID", "UnitID");
		dataTableMapping.ColumnMappings.Add("Price", "Price");
		dataTableMapping.ColumnMappings.Add("Cost", "Cost");
		dataTableMapping.ColumnMappings.Add("Tare", "Tare");
		dataTableMapping.ColumnMappings.Add("BarF1", "BarF1");
		dataTableMapping.ColumnMappings.Add("BarF2", "BarF2");
		dataTableMapping.ColumnMappings.Add("BarT1", "BarT1");
		dataTableMapping.ColumnMappings.Add("BarT2", "BarT2");
		dataTableMapping.ColumnMappings.Add("LabelID1", "LabelID1");
		dataTableMapping.ColumnMappings.Add("LabelID2", "LabelID2");
		dataTableMapping.ColumnMappings.Add("ClassID", "ClassID");
		dataTableMapping.ColumnMappings.Add("PS_SD", "PS_SD");
		dataTableMapping.ColumnMappings.Add("PS_ST", "PS_ST");
		dataTableMapping.ColumnMappings.Add("PS_PD", "PS_PD");
		dataTableMapping.ColumnMappings.Add("PS_PT", "PS_PT");
		dataTableMapping.ColumnMappings.Add("PS_UD", "PS_UD");
		dataTableMapping.ColumnMappings.Add("PC_SD", "PC_SD");
		dataTableMapping.ColumnMappings.Add("PC_PD", "PC_PD");
		dataTableMapping.ColumnMappings.Add("PC_UD", "PC_UD");
		dataTableMapping.ColumnMappings.Add("DF_U", "DF_U");
		dataTableMapping.ColumnMappings.Add("DF_D", "DF_D");
		dataTableMapping.ColumnMappings.Add("DF_UN", "DF_UN");
		dataTableMapping.ColumnMappings.Add("DF_DN", "DF_DN");
		dataTableMapping.ColumnMappings.Add("DA_Sort1", "DA_Sort1");
		dataTableMapping.ColumnMappings.Add("DA_Up1", "DA_Up1");
		dataTableMapping.ColumnMappings.Add("DA_Dn1", "DA_Dn1");
		dataTableMapping.ColumnMappings.Add("DA_Num1", "DA_Num1");
		dataTableMapping.ColumnMappings.Add("DA_Sort2", "DA_Sort2");
		dataTableMapping.ColumnMappings.Add("DA_Up2", "DA_Up2");
		dataTableMapping.ColumnMappings.Add("DA_Dn2", "DA_Dn2");
		dataTableMapping.ColumnMappings.Add("DA_Num2", "DA_Num2");
		dataTableMapping.ColumnMappings.Add("DA_Sort3", "DA_Sort3");
		dataTableMapping.ColumnMappings.Add("DA_Up3", "DA_Up3");
		dataTableMapping.ColumnMappings.Add("DA_Dn3", "DA_Dn3");
		dataTableMapping.ColumnMappings.Add("DA_Num3", "DA_Num3");
		dataTableMapping.ColumnMappings.Add("DA_Sort4", "DA_Sort4");
		dataTableMapping.ColumnMappings.Add("DA_Up4", "DA_Up4");
		dataTableMapping.ColumnMappings.Add("DA_Dn4", "DA_Dn4");
		dataTableMapping.ColumnMappings.Add("DA_Num4", "DA_Num4");
		dataTableMapping.ColumnMappings.Add("Name", "Name");
		dataTableMapping.ColumnMappings.Add("Text1", "Text1");
		dataTableMapping.ColumnMappings.Add("Text2", "Text2");
		dataTableMapping.ColumnMappings.Add("Text3", "Text3");
		dataTableMapping.ColumnMappings.Add("Text4", "Text4");
		dataTableMapping.ColumnMappings.Add("Text5", "Text5");
		dataTableMapping.ColumnMappings.Add("Text6", "Text6");
		dataTableMapping.ColumnMappings.Add("Text7", "Text7");
		dataTableMapping.ColumnMappings.Add("PC_ST", "PC_ST");
		dataTableMapping.ColumnMappings.Add("PC_PT", "PC_PT");
		dataTableMapping.ColumnMappings.Add("TaxType", "TaxType");
		dataTableMapping.ColumnMappings.Add("Tax", "Tax");
		dataTableMapping.ColumnMappings.Add("SspValue1", "SspValue1");
		dataTableMapping.ColumnMappings.Add("SspValue2", "SspValue2");
		dataTableMapping.ColumnMappings.Add("SspValue3", "SspValue3");
		dataTableMapping.ColumnMappings.Add("SspValue4", "SspValue4");
		dataTableMapping.ColumnMappings.Add("Valid", "Valid");
		dataTableMapping.ColumnMappings.Add("DA_Day1", "DA_Day1");
		dataTableMapping.ColumnMappings.Add("DA_Day2", "DA_Day2");
		dataTableMapping.ColumnMappings.Add("DA_Day3", "DA_Day3");
		dataTableMapping.ColumnMappings.Add("DA_Day4", "DA_Day4");
		dataTableMapping.ColumnMappings.Add("SType", "SType");
		dataTableMapping.ColumnMappings.Add("ALPHA", "ALPHA");
		dataTableMapping.ColumnMappings.Add("Flag", "Flag");
		dataTableMapping.ColumnMappings.Add("Flag_Value", "Flag_Value");
		dataTableMapping.ColumnMappings.Add("Bitmap", "Bitmap");
		_adapter.TableMappings.Add(dataTableMapping);
		_adapter.DeleteCommand = new OleDbCommand();
		_adapter.DeleteCommand.Connection = Connection;
		_adapter.DeleteCommand.CommandText = "DELETE FROM `PLU` WHERE ((`PLUID` = ?))";
		_adapter.DeleteCommand.CommandType = CommandType.Text;
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_PLUID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLUID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand = new OleDbCommand();
		_adapter.InsertCommand.Connection = Connection;
		_adapter.InsertCommand.CommandText = "INSERT INTO `PLU` (`PLUID`, `Remark`, `Index`, `UnitID`, `Price`, `Cost`, `Tare`, `BarF1`, `BarF2`, `BarT1`, `BarT2`, `LabelID1`, `LabelID2`, `ClassID`, `PS_SD`, `PS_ST`, `PS_PD`, `PS_PT`, `PS_UD`, `PC_SD`, `PC_ST`, `PC_PD`, `PC_PT`, `PC_UD`, `DF_U`, `DF_D`, `DF_UN`, `DF_DN`, `DA_Sort1`, `DA_Day1`, `DA_Up1`, `DA_Dn1`, `DA_Num1`, `DA_Sort2`, `DA_Day2`, `DA_Up2`, `DA_Dn2`, `DA_Num2`, `DA_Sort3`, `DA_Day3`, `DA_Up3`, `DA_Dn3`, `DA_Num3`, `DA_Sort4`, `DA_Day4`, `DA_Up4`, `DA_Dn4`, `DA_Num4`, `Name`, `Text1`, `Text2`, `Text3`, `Text4`, `Text5`, `Text6`, `Text7`, `TaxType`, `Tax`, `SspValue1`, `SspValue2`, `SspValue3`, `SspValue4`, `SType`, `Valid`, `ALPHA`, `Flag`, `Flag_Value`, `Bitmap`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
		_adapter.InsertCommand.CommandType = CommandType.Text;
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PLUID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLUID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Remark", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Remark", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Index", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Index", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("UnitID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "UnitID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Price", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Price", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Cost", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Cost", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Tare", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Tare", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("BarF1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("BarF2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("BarT1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("BarT2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("LabelID1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("LabelID2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("ClassID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "ClassID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PS_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_SD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PS_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_ST", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PS_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PS_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PT", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PS_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_UD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PC_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_SD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PC_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_ST", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PC_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PC_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PT", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PC_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_UD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DF_U", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_U", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DF_D", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_D", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DF_UN", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DF_UN", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DF_DN", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DF_DN", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Sort1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Day1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Up1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Dn1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Num1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Sort2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Day2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Up2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Dn2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Num2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Sort3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Day3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Up3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Dn3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Num3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Sort4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Day4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Up4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Dn4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Num4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Name", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text1", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text2", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text3", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text4", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text5", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text5", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text6", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text6", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text7", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text7", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("TaxType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "TaxType", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Tax", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Tax", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SspValue1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SspValue2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SspValue3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SspValue4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SType", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Valid", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "Valid", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("ALPHA", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "ALPHA", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Flag", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Flag", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Flag_Value", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Flag_Value", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Bitmap", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Bitmap", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand = new OleDbCommand();
		_adapter.UpdateCommand.Connection = Connection;
		_adapter.UpdateCommand.CommandText = "UPDATE `PLU` SET `PLUID` = ?, `Remark` = ?, `Index` = ?, `UnitID` = ?, `Price` = ?, `Cost` = ?, `Tare` = ?, `BarF1` = ?, `BarF2` = ?, `BarT1` = ?, `BarT2` = ?, `LabelID1` = ?, `LabelID2` = ?, `ClassID` = ?, `PS_SD` = ?, `PS_ST` = ?, `PS_PD` = ?, `PS_PT` = ?, `PS_UD` = ?, `PC_SD` = ?, `PC_ST` = ?, `PC_PD` = ?, `PC_PT` = ?, `PC_UD` = ?, `DF_U` = ?, `DF_D` = ?, `DF_UN` = ?, `DF_DN` = ?, `DA_Sort1` = ?, `DA_Day1` = ?, `DA_Up1` = ?, `DA_Dn1` = ?, `DA_Num1` = ?, `DA_Sort2` = ?, `DA_Day2` = ?, `DA_Up2` = ?, `DA_Dn2` = ?, `DA_Num2` = ?, `DA_Sort3` = ?, `DA_Day3` = ?, `DA_Up3` = ?, `DA_Dn3` = ?, `DA_Num3` = ?, `DA_Sort4` = ?, `DA_Day4` = ?, `DA_Up4` = ?, `DA_Dn4` = ?, `DA_Num4` = ?, `Name` = ?, `Text1` = ?, `Text2` = ?, `Text3` = ?, `Text4` = ?, `Text5` = ?, `Text6` = ?, `Text7` = ?, `TaxType` = ?, `Tax` = ?, `SspValue1` = ?, `SspValue2` = ?, `SspValue3` = ?, `SspValue4` = ?, `SType` = ?, `Valid` = ?, `ALPHA` = ?, `Flag` = ?, `Flag_Value` = ?, `Bitmap` = ? WHERE ((`PLUID` = ?))";
		_adapter.UpdateCommand.CommandType = CommandType.Text;
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PLUID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLUID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Remark", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Remark", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Index", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Index", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("UnitID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "UnitID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Price", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Price", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Cost", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Cost", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Tare", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Tare", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("BarF1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("BarF2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("BarT1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("BarT2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("LabelID1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("LabelID2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("ClassID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "ClassID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PS_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_SD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PS_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_ST", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PS_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PS_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PT", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PS_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_UD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PC_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_SD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PC_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_ST", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PC_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PC_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PT", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PC_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_UD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DF_U", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_U", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DF_D", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_D", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DF_UN", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DF_UN", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DF_DN", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DF_DN", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Sort1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Day1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Up1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Dn1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Num1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Sort2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Day2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Up2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Dn2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Num2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Sort3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Day3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Up3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Dn3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Num3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Sort4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Day4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Up4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Dn4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Num4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Name", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text1", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text2", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text3", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text4", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text5", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text5", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text6", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text6", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text7", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text7", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("TaxType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "TaxType", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Tax", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Tax", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SspValue1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SspValue2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SspValue3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SspValue4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SType", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Valid", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "Valid", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("ALPHA", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "ALPHA", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Flag", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Flag", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Flag_Value", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Flag_Value", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Bitmap", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Bitmap", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_PLUID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLUID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private void InitConnection()
	{
		_connection = new OleDbConnection();
		_connection.ConnectionString = Settings.Default.ECSConnectionString;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private void InitCommandCollection()
	{
		_commandCollection = new OleDbCommand[2];
		_commandCollection[0] = new OleDbCommand();
		_commandCollection[0].Connection = Connection;
		_commandCollection[0].CommandText = "SELECT PLUID, Remark, [Index], UnitID, Price, Cost, Tare, BarF1, BarF2, BarT1, BarT2, \r\n      LabelID1, LabelID2, ClassID, PS_SD, PS_ST, PS_PD, PS_PT, PS_UD, PC_SD, PC_ST, \r\n      PC_PD, PC_PT, PC_UD, DF_U, DF_D, DF_UN, DF_DN, DA_Sort1, DA_Day1, DA_Up1, \r\n      DA_Dn1, DA_Num1, DA_Sort2, DA_Day2, DA_Up2, DA_Dn2, DA_Num2, DA_Sort3, \r\n      DA_Day3, DA_Up3, DA_Dn3, DA_Num3, DA_Sort4, DA_Day4, DA_Up4, DA_Dn4, \r\n      DA_Num4, Name, Text1, Text2, Text3, Text4, Text5, Text6, Text7, TaxType, Tax, \r\n      SspValue1, SspValue2, SspValue3, SspValue4, SType, Valid, ALPHA, Flag, \r\n      Flag_Value, Bitmap\r\nFROM PLU\r\nORDER BY PLUID";
		_commandCollection[0].CommandType = CommandType.Text;
		_commandCollection[1] = new OleDbCommand();
		_commandCollection[1].Connection = Connection;
		_commandCollection[1].CommandText = "DELETE FROM PLU";
		_commandCollection[1].CommandType = CommandType.Text;
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DataObjectMethod(DataObjectMethodType.Fill, true)]
	public virtual int Fill(ECSDataSet.PLUDataTable dataTable)
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
	public virtual int Update(ECSDataSet.PLUDataTable dataTable)
	{
		return Adapter.Update(dataTable);
	}

	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Update(ECSDataSet dataSet)
	{
		return Adapter.Update(dataSet, "PLU");
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

	[DebuggerNonUserCode]
	[DataObjectMethod(DataObjectMethodType.Delete, false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int DeleteQuery()
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
