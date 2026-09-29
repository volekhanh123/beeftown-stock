using System.CodeDom.Compiler;
using System.ComponentModel;
using System.ComponentModel.Design;
using System.Data;
using System.Data.Common;
using System.Data.OleDb;
using System.Diagnostics;
using ECS.Properties;

namespace ECS.ECSDataSetTableAdapters;

[HelpKeyword("vs.data.TableAdapter")]
[DesignerCategory("code")]
[ToolboxItem(true)]
[Designer("Microsoft.VSDesigner.DataSource.Design.TableAdapterDesigner, Microsoft.VSDesigner, Version=10.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a")]
[DataObject(true)]
public class PLUwUnitTableAdapter : Component
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
	public PLUwUnitTableAdapter()
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
		dataTableMapping.DataSetTable = "PLUwUnit";
		dataTableMapping.ColumnMappings.Add("PLUID", "PLUID");
		dataTableMapping.ColumnMappings.Add("Valid", "Valid");
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
		dataTableMapping.ColumnMappings.Add("PC_ST", "PC_ST");
		dataTableMapping.ColumnMappings.Add("PC_PD", "PC_PD");
		dataTableMapping.ColumnMappings.Add("PC_PT", "PC_PT");
		dataTableMapping.ColumnMappings.Add("PC_UD", "PC_UD");
		dataTableMapping.ColumnMappings.Add("DF_U", "DF_U");
		dataTableMapping.ColumnMappings.Add("DF_D", "DF_D");
		dataTableMapping.ColumnMappings.Add("DF_UN", "DF_UN");
		dataTableMapping.ColumnMappings.Add("DF_DN", "DF_DN");
		dataTableMapping.ColumnMappings.Add("DA_Sort1", "DA_Sort1");
		dataTableMapping.ColumnMappings.Add("DA_Day1", "DA_Day1");
		dataTableMapping.ColumnMappings.Add("DA_Up1", "DA_Up1");
		dataTableMapping.ColumnMappings.Add("DA_Dn1", "DA_Dn1");
		dataTableMapping.ColumnMappings.Add("DA_Num1", "DA_Num1");
		dataTableMapping.ColumnMappings.Add("DA_Sort2", "DA_Sort2");
		dataTableMapping.ColumnMappings.Add("DA_Day2", "DA_Day2");
		dataTableMapping.ColumnMappings.Add("DA_Up2", "DA_Up2");
		dataTableMapping.ColumnMappings.Add("DA_Dn2", "DA_Dn2");
		dataTableMapping.ColumnMappings.Add("DA_Num2", "DA_Num2");
		dataTableMapping.ColumnMappings.Add("DA_Sort3", "DA_Sort3");
		dataTableMapping.ColumnMappings.Add("DA_Day3", "DA_Day3");
		dataTableMapping.ColumnMappings.Add("DA_Up3", "DA_Up3");
		dataTableMapping.ColumnMappings.Add("DA_Dn3", "DA_Dn3");
		dataTableMapping.ColumnMappings.Add("DA_Num3", "DA_Num3");
		dataTableMapping.ColumnMappings.Add("DA_Sort4", "DA_Sort4");
		dataTableMapping.ColumnMappings.Add("DA_Day4", "DA_Day4");
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
		dataTableMapping.ColumnMappings.Add("TaxType", "TaxType");
		dataTableMapping.ColumnMappings.Add("Tax", "Tax");
		dataTableMapping.ColumnMappings.Add("SspValue1", "SspValue1");
		dataTableMapping.ColumnMappings.Add("SspValue2", "SspValue2");
		dataTableMapping.ColumnMappings.Add("SspValue3", "SspValue3");
		dataTableMapping.ColumnMappings.Add("SspValue4", "SspValue4");
		dataTableMapping.ColumnMappings.Add("SType", "SType");
		dataTableMapping.ColumnMappings.Add("UnitName", "UnitName");
		dataTableMapping.ColumnMappings.Add("Punit", "Punit");
		_adapter.TableMappings.Add(dataTableMapping);
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
		_commandCollection[0].CommandText = "SELECT PLU.PLUID, PLU.Valid, PLU.Remark, PLU.[Index], PLU.UnitID, PLU.Price, PLU.Cost, \r\n      PLU.Tare, PLU.BarF1, PLU.BarF2, PLU.BarT1, PLU.BarT2, PLU.LabelID1, \r\n      PLU.LabelID2, PLU.ClassID, PLU.PS_SD, PLU.PS_ST, PLU.PS_PD, PLU.PS_PT, \r\n      PLU.PS_UD, PLU.PC_SD, PLU.PC_ST, PLU.PC_PD, PLU.PC_PT, PLU.PC_UD, \r\n      PLU.DF_U, PLU.DF_D, PLU.DF_UN, PLU.DF_DN, PLU.DA_Sort1, PLU.DA_Day1, \r\n      PLU.DA_Up1, PLU.DA_Dn1, PLU.DA_Num1, PLU.DA_Sort2, PLU.DA_Day2, \r\n      PLU.DA_Up2, PLU.DA_Dn2, PLU.DA_Num2, PLU.DA_Sort3, PLU.DA_Day3, \r\n      PLU.DA_Up3, PLU.DA_Dn3, PLU.DA_Num3, PLU.DA_Sort4, PLU.DA_Day4, \r\n      PLU.DA_Up4, PLU.DA_Dn4, PLU.DA_Num4, PLU.Name, PLU.Text1, PLU.Text2, \r\n      PLU.Text3, PLU.Text4, PLU.Text5, PLU.Text6, PLU.Text7, PLU.TaxType, PLU.Tax, \r\n      PLU.SspValue1, PLU.SspValue2, PLU.SspValue3, PLU.SspValue4, PLU.SType, \r\n      Unit.Name AS UnitName, Unit.Punit\r\nFROM (PLU INNER JOIN\r\n      Unit ON PLU.UnitID = Unit.UnitID)";
		_commandCollection[0].CommandType = CommandType.Text;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DataObjectMethod(DataObjectMethodType.Fill, true)]
	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Fill(ECSDataSet.PLUwUnitDataTable dataTable)
	{
		Adapter.SelectCommand = CommandCollection[0];
		if (ClearBeforeFill)
		{
			dataTable.Clear();
		}
		return Adapter.Fill(dataTable);
	}
}
