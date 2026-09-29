using System;
using System.Data;
using System.IO;
using System.Text;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;
using ECS.ReportDataSetTableAdapters;

namespace ECS;

internal class RDS
{
	private class SimComboVD_No
	{
		private int value;

		private string display;

		public int Value
		{
			get
			{
				return value;
			}
			set
			{
				this.value = value;
			}
		}

		public string Display
		{
			get
			{
				return display;
			}
			set
			{
				display = value;
			}
		}
	}

	public enum Type_All
	{
		NULL = -1,
		Sale = 0,
		BuyBack = 1,
		Unconfirmed = 2,
		Deleted = 3,
		Hangup = 4,
		SP05 = 5,
		SP06 = 6,
		SP07 = 7,
		SP08 = 8,
		SP09 = 9,
		Inbound = 10,
		Outbound = 11,
		Stocktaking = 12,
		Order = 13,
		Spoilage = 14,
		SP15 = 15,
		Produce = 252,
		Unpacking_Increase = 253,
		Unpacking_Decrease = 254,
		Error = 255
	}

	private enum PLUKeep_List
	{
		PLUKeep_Name,
		PLUKeep_ItemCode,
		PLUKeep_Index,
		PLUKeep_Class,
		PLUKeep_UnitID,
		PLUKeep_Tare,
		PLUKeep_PercentTare,
		PLUKeep_FixedWeight,
		PLUKeep_MeasureWord,
		PLUKeep_Price,
		PLUKeep_Cost,
		PLUKeep_Tax,
		PLUKeep_SSP1,
		PLUKeep_SSP2,
		PLUKeep_SSP3,
		PLUKeep_SSP4,
		PLUKeep_SType,
		PLUKeep_Label1,
		PLUKeep_Barcode1,
		PLUKeep_Label2,
		PLUKeep_Barcode2,
		PLUKeep_Bitmap,
		PLUKeep_Text1,
		PLUKeep_Text2,
		PLUKeep_Text3,
		PLUKeep_Text4,
		PLUKeep_Text5,
		PLUKeep_Text6,
		PLUKeep_Text7,
		PLUKeep_TimeSD,
		PLUKeep_TimeST,
		PLUKeep_TimePD,
		PLUKeep_TimePT,
		PLUKeep_TimeUD,
		PLUKeep_ManualDiscount,
		PLUKeep_AutoDiscount
	}

	public static ReportDataSet reportDataSet = new ReportDataSet();

	public static ECSDataSet eCSDataSet = new ECSDataSet();

	private static UIDataSet uiDataSet = new UIDataSet();

	private static BarcodeTableAdapter barcodeTableAdapter = new BarcodeTableAdapter();

	private static ClassTableAdapter classTableAdapter = new ClassTableAdapter();

	private static CoPLU_BoxPcsTableAdapter coPLU_BoxPcsTableAdapter = new CoPLU_BoxPcsTableAdapter();

	private static CoPLU_ProMatTableAdapter coPLU_ProMatTableAdapter = new CoPLU_ProMatTableAdapter();

	private static Custom1TableAdapter custom1TableAdapter = new Custom1TableAdapter();

	private static Custom2TableAdapter custom2TableAdapter = new Custom2TableAdapter();

	private static Custom3TableAdapter custom3TableAdapter = new Custom3TableAdapter();

	private static Custom4TableAdapter custom4TableAdapter = new Custom4TableAdapter();

	private static DeptTableAdapter deptTableAdapter = new DeptTableAdapter();

	private static FaceTableAdapter faceTableAdapter = new FaceTableAdapter();

	private static FaceListTableAdapter faceListTableAdapter = new FaceListTableAdapter();

	private static LabelTableAdapter labelTableAdapter = new LabelTableAdapter();

	private static LabelItemTableAdapter labelItemTableAdapter = new LabelItemTableAdapter();

	private static PLUTableAdapter pLUTableAdapter = new PLUTableAdapter();

	private static SalesmanTableAdapter salesmanTableAdapter = new SalesmanTableAdapter();

	private static SpecTableAdapter specTableAdapter = new SpecTableAdapter();

	private static StringTableAdapter stringTableAdapter = new StringTableAdapter();

	private static VIPTableAdapter vipTableAdapter = new VIPTableAdapter();

	private static UnitTableAdapter unitTableAdapter = new UnitTableAdapter();

	private static bool nb_Barcode = false;

	private static bool nb_Class = false;

	private static bool nb_CoPLU_BoxPcs = false;

	private static bool nb_CoPLU_ProMat = false;

	private static bool nb_Custom1 = false;

	private static bool nb_Custom2 = false;

	private static bool nb_Custom3 = false;

	private static bool nb_Custom4 = false;

	private static bool nb_Dept = false;

	private static bool nb_Face = false;

	private static bool nb_Label = false;

	private static bool nb_PLU = false;

	private static bool nb_Salesman = false;

	private static bool nb_Spec = false;

	private static bool nb_String = false;

	private static bool nb_VIP = false;

	private static LogTableAdapter logTableAdapter = new LogTableAdapter();

	private static LogItemTableAdapter logItemTableAdapter = new LogItemTableAdapter();

	private static StockItemTableAdapter stockItemTableAdapter = new StockItemTableAdapter();

	private static StockTableAdapter stockTableAdapter = new StockTableAdapter();

	private static DeviceTableAdapter deviceTableAdapter = new DeviceTableAdapter();

	private static SGroupTableAdapter sGroupTableAdapter = new SGroupTableAdapter();

	private static rLogsTypeTableAdapter rLogsTypeTableAdapter = new rLogsTypeTableAdapter();

	private static rStockTypeTableAdapter rStockTypeTableAdapter = new rStockTypeTableAdapter();

	private static HistoryTableAdapter historyTableAdapter = new HistoryTableAdapter();

	private static bool Stocked;

	private static bool Stocked_PClog;

	private static UIDataSet.CustomRow custom1Row;

	private static UIDataSet.CustomRow custom2Row;

	private static UIDataSet.CustomRow custom3Row;

	private static UIDataSet.CustomRow custom4Row;

	public static DateTime History_DT;

	public static int[] PLUImportKeep_Para;

	public static bool PLUImportKeep_Some = false;

	private static void DateSet_GetNew(string target)
	{
		switch (target)
		{
		case "PLU":
			if (!nb_PLU)
			{
				pLUTableAdapter.ClearBeforeFill = true;
				pLUTableAdapter.Fill(eCSDataSet.PLU);
				string[] array = uiDataSet.SimCombo.FindByName("PLU Default").ValueDisplay.Split('|');
				for (int i = 0; i < array.Length / 2; i++)
				{
					int num = int.Parse(array[i * 2]);
					ECSDataSet.PLURow pLURow = eCSDataSet.PLU.FindByPLUID(num);
					if (pLURow == null)
					{
						pLURow = eCSDataSet.PLU.NewPLURow();
						pLURow.PLUID = num;
						switch (num)
						{
						case 9999994:
							pLURow.Name = string.Format(array[i * 2 + 1], Program.GetLang_Plus("pw_Payment1"));
							break;
						case 9999993:
							pLURow.Name = string.Format(array[i * 2 + 1], Program.GetLang_Plus("pw_Payment2"));
							break;
						case 9999992:
							pLURow.Name = string.Format(array[i * 2 + 1], Program.GetLang_Plus("pw_Payment3"));
							break;
						default:
							pLURow.Name = array[i * 2 + 1];
							break;
						}
						pLURow.Cost = 0m;
						if (i == 0)
						{
							pLURow.UnitID = 1;
						}
						else
						{
							pLURow.UnitID = 2;
						}
						eCSDataSet.PLU.AddPLURow(pLURow);
					}
					else
					{
						switch (num)
						{
						case 9999994:
							pLURow.Name = string.Format(array[i * 2 + 1], Program.GetLang_Plus("pw_Payment1"));
							break;
						case 9999993:
							pLURow.Name = string.Format(array[i * 2 + 1], Program.GetLang_Plus("pw_Payment2"));
							break;
						case 9999992:
							pLURow.Name = string.Format(array[i * 2 + 1], Program.GetLang_Plus("pw_Payment3"));
							break;
						default:
							pLURow.Name = array[i * 2 + 1];
							break;
						}
						pLURow.Cost = 0m;
						if (i == 0)
						{
							pLURow.UnitID = 1;
						}
						else
						{
							pLURow.UnitID = 2;
						}
					}
				}
				nb_PLU = true;
			}
			if (!nb_CoPLU_BoxPcs)
			{
				coPLU_BoxPcsTableAdapter.ClearBeforeFill = true;
				coPLU_BoxPcsTableAdapter.Fill(eCSDataSet.CoPLU_BoxPcs);
				nb_CoPLU_BoxPcs = true;
			}
			if (!nb_CoPLU_ProMat)
			{
				coPLU_ProMatTableAdapter.ClearBeforeFill = true;
				coPLU_ProMatTableAdapter.Fill(eCSDataSet.CoPLU_ProMat);
				nb_CoPLU_ProMat = true;
			}
			break;
		case "Barcode":
			if (!nb_Barcode)
			{
				barcodeTableAdapter.ClearBeforeFill = true;
				barcodeTableAdapter.Fill(eCSDataSet.Barcode);
				nb_Barcode = true;
			}
			break;
		case "Class":
			if (!nb_Class)
			{
				classTableAdapter.ClearBeforeFill = true;
				classTableAdapter.Fill(eCSDataSet.Class);
				nb_Class = true;
			}
			break;
		case "CoPLU_BoxPcs":
			if (!nb_CoPLU_BoxPcs)
			{
				coPLU_BoxPcsTableAdapter.ClearBeforeFill = true;
				coPLU_BoxPcsTableAdapter.Fill(eCSDataSet.CoPLU_BoxPcs);
				nb_CoPLU_BoxPcs = true;
			}
			break;
		case "CoPLU_ProMat":
			if (!nb_CoPLU_ProMat)
			{
				coPLU_ProMatTableAdapter.ClearBeforeFill = true;
				coPLU_ProMatTableAdapter.Fill(eCSDataSet.CoPLU_ProMat);
				nb_CoPLU_ProMat = true;
			}
			break;
		case "Custom1":
			if (!nb_Custom1)
			{
				custom1TableAdapter.ClearBeforeFill = true;
				custom1TableAdapter.Fill(eCSDataSet.Custom1);
				nb_Custom1 = true;
			}
			break;
		case "Custom2":
			if (!nb_Custom2)
			{
				custom2TableAdapter.ClearBeforeFill = true;
				custom2TableAdapter.Fill(eCSDataSet.Custom2);
				nb_Custom2 = true;
			}
			break;
		case "Custom3":
			if (!nb_Custom3)
			{
				custom3TableAdapter.ClearBeforeFill = true;
				custom3TableAdapter.Fill(eCSDataSet.Custom3);
				nb_Custom3 = true;
			}
			break;
		case "Custom4":
			if (!nb_Custom4)
			{
				custom4TableAdapter.ClearBeforeFill = true;
				custom4TableAdapter.Fill(eCSDataSet.Custom4);
				nb_Custom4 = true;
			}
			break;
		case "Dept":
			if (!nb_Dept)
			{
				deptTableAdapter.ClearBeforeFill = true;
				deptTableAdapter.Fill(eCSDataSet.Dept);
				nb_Dept = true;
			}
			break;
		case "Face":
			if (!nb_Face)
			{
				eCSDataSet.Face.Clear();
				faceListTableAdapter.ClearBeforeFill = true;
				faceListTableAdapter.Fill(eCSDataSet.FaceList);
				faceTableAdapter.Fill(eCSDataSet.Face);
				nb_Face = true;
			}
			break;
		case "Label":
			if (!nb_Label)
			{
				eCSDataSet.LabelItem.Clear();
				labelTableAdapter.ClearBeforeFill = true;
				labelTableAdapter.Fill(eCSDataSet.Label);
				labelItemTableAdapter.Fill(eCSDataSet.LabelItem);
				nb_Label = true;
			}
			break;
		case "Salesman":
			if (!nb_Salesman)
			{
				salesmanTableAdapter.ClearBeforeFill = true;
				salesmanTableAdapter.Fill(eCSDataSet.Salesman);
				nb_Salesman = true;
			}
			break;
		case "Spec":
			if (!nb_Spec)
			{
				specTableAdapter.ClearBeforeFill = true;
				specTableAdapter.Fill(eCSDataSet.Spec);
				nb_Spec = true;
			}
			break;
		case "String":
			if (!nb_String)
			{
				stringTableAdapter.ClearBeforeFill = true;
				stringTableAdapter.Fill(eCSDataSet.String);
				nb_String = true;
			}
			break;
		case "VIP":
			if (!nb_VIP)
			{
				vipTableAdapter.ClearBeforeFill = true;
				vipTableAdapter.Fill(eCSDataSet.VIP);
				nb_VIP = true;
			}
			break;
		}
	}

	private static void DateSet_UpdateNew(string target)
	{
		switch (target)
		{
		case "PLU":
			pLUTableAdapter.Update(eCSDataSet.PLU);
			break;
		case "Barcode":
			barcodeTableAdapter.Update(eCSDataSet.Barcode);
			break;
		case "Class":
			classTableAdapter.Update(eCSDataSet.Class);
			break;
		case "CoPLU_BoxPcs":
			coPLU_BoxPcsTableAdapter.Update(eCSDataSet.CoPLU_BoxPcs);
			break;
		case "CoPLU_ProMat":
			coPLU_ProMatTableAdapter.Update(eCSDataSet.CoPLU_ProMat);
			break;
		case "Custom1":
			custom1TableAdapter.Update(eCSDataSet.Custom1);
			break;
		case "Custom2":
			custom2TableAdapter.Update(eCSDataSet.Custom2);
			break;
		case "Custom3":
			custom3TableAdapter.Update(eCSDataSet.Custom3);
			break;
		case "Custom4":
			custom4TableAdapter.Update(eCSDataSet.Custom4);
			break;
		case "Dept":
			deptTableAdapter.Update(eCSDataSet.Dept);
			break;
		case "Face":
			faceListTableAdapter.Update(eCSDataSet.FaceList);
			faceTableAdapter.Update(eCSDataSet.Face);
			break;
		case "Label":
			labelTableAdapter.Update(eCSDataSet.Label);
			labelItemTableAdapter.Update(eCSDataSet.LabelItem);
			break;
		case "Salesman":
			salesmanTableAdapter.Update(eCSDataSet.Salesman);
			break;
		case "Spec":
			specTableAdapter.Update(eCSDataSet.Spec);
			break;
		case "String":
			stringTableAdapter.Update(eCSDataSet.String);
			break;
		case "VIP":
			vipTableAdapter.Update(eCSDataSet.VIP);
			break;
		}
		DataSet_Update(target);
	}

	public static decimal Calculate_GoPrice(decimal Input)
	{
		return Math.Round(Input, Settings.Default.Format_Price);
	}

	public static decimal Calculate_TotalPrice(decimal pUnitPrice, decimal pAmount)
	{
		return Math.Round(pAmount * pUnitPrice, Settings.Default.Format_Price);
	}

	public static decimal Calculate_UnitPrice(decimal pPrice, decimal pAmount)
	{
		return Math.Round(pPrice / pAmount, Settings.Default.Format_Price);
	}

	public static void DataSet_Init_Unit(ref ECSDataSet eCSDataSet)
	{
		string[] array = Program.GetLang("pw_AllUnitMeasure").Split('|');
		string[] array2 = new string[9] { "Weight", "pcs", "kg", "g", "ton", "lb", "500g", "100g", "1/4lb" };
		decimal[] array3 = new decimal[9] { 1m, 1m, 1000m, 1m, 1000000m, 453.592m, 500m, 100m, 113.398m };
		eCSDataSet.Unit.Clear();
		for (int i = 0; i < 9; i++)
		{
			ECSDataSet.UnitRow unitRow = eCSDataSet.Unit.NewUnitRow();
			unitRow.UnitID = i + 1;
			unitRow.Punit = ((i != 1) ? 1 : 2);
			if (array.Length == 9)
			{
				unitRow.Name = array[i];
			}
			else
			{
				unitRow.Name = array2[i];
			}
			unitRow.Pamount = unitRow.UnitID + " - " + unitRow.Name;
			unitRow.Pack = array3[i];
			eCSDataSet.Unit.AddUnitRow(unitRow);
		}
	}

	private static void DataSet_Init_FindCustom()
	{
		string fileName = Application.StartupPath + "\\Custom.xml";
		uiDataSet.Custom.ReadXml(fileName);
		DataRow[] array = uiDataSet.Custom.Select("[Table] = 'Custom1'");
		if (array.Length > 0)
		{
			custom1Row = array[0] as UIDataSet.CustomRow;
		}
		array = uiDataSet.Custom.Select("[Table] = 'Custom2'");
		if (array.Length > 0)
		{
			custom2Row = array[0] as UIDataSet.CustomRow;
		}
		array = uiDataSet.Custom.Select("[Table] = 'Custom3'");
		if (array.Length > 0)
		{
			custom3Row = array[0] as UIDataSet.CustomRow;
		}
		array = uiDataSet.Custom.Select("[Table] = 'Custom4'");
		if (array.Length > 0)
		{
			custom4Row = array[0] as UIDataSet.CustomRow;
		}
	}

	private static void DataSet_ReadTMS_SaveCustom(StreamWriter sw, UIDataSet.CustomRow row, bool bclear)
	{
		string keyword = row.Keyword;
		DataTable dataTable = eCSDataSet.Tables[row._Table];
		if (bclear)
		{
			sw.WriteLine($"CLR\t{keyword}\t");
			sw.WriteLine("CLR\tEND\t");
		}
		sw.WriteLine($"DWL\t{keyword}\t");
		foreach (DataRow row2 in dataTable.Rows)
		{
			sw.Write($"{keyword}\t");
			UIDataSet.CustomItemRow[] customItemRows = row.GetCustomItemRows();
			foreach (UIDataSet.CustomItemRow customItemRow in customItemRows)
			{
				if (!(customItemRow.Field == "NULL"))
				{
					object obj = row2[customItemRow.Field];
					if (obj.GetType() == typeof(int))
					{
						sw.Write($"{obj}\t");
					}
					else if (obj.GetType() == typeof(string))
					{
						sw.Write($"{Program.FormatString(obj as string)}\t");
					}
					else if (obj.GetType() == typeof(decimal))
					{
						sw.Write($"{Program.FormatDecimal((decimal)obj, Program.DecimalFormat.None)}\t");
					}
					else
					{
						sw.Write($"\t");
					}
				}
			}
			sw.WriteLine();
		}
		sw.WriteLine($"END\t{keyword}\t");
		sw.Flush();
	}

	private static void DataSet_ReadTMS_OpenCustomRow(ref ECSDataSet eSet, UIDataSet.CustomRow row, string[] items)
	{
		if (row == null)
		{
			return;
		}
		string keyword = row.Keyword;
		if (items[0] != keyword)
		{
			return;
		}
		DataTable dataTable = eSet.Tables[row._Table];
		DataRow dataRow = dataTable.NewRow();
		try
		{
			UIDataSet.CustomItemRow[] customItemRows = row.GetCustomItemRows();
			int num;
			for (int i = (num = 0); i < customItemRows.Length; i++)
			{
				string field = customItemRows[i].Field;
				if (!(field == "NULL"))
				{
					if (dataRow[field].GetType() == typeof(int))
					{
						dataRow[field] = Program.ParseInt(items[num + 1]);
					}
					else if (dataRow[field].GetType() == typeof(string))
					{
						dataRow[field] = Program.ParseString(items[num + 1]);
					}
					else if (dataRow[field].GetType() == typeof(decimal))
					{
						dataRow[field] = Program.ParseDecimal(items[num + 1]);
					}
					num++;
				}
			}
		}
		catch (IndexOutOfRangeException)
		{
		}
		dataTable.Rows.Add(dataRow);
	}

	public static Exception DataSet_ReadTMS(ref ECSDataSet newData, ref ECSDataSet oldData, string codeType, string fileName, string DU_Form, bool protect, bool bspec, bool bstring, string sface, bool bdept, bool bclass, bool bpLU, bool bbarcode, bool blabel, bool bsalesman, bool bvip, bool bcustom1, bool bcustom2, bool bcustom3, bool bcustom4)
	{
		Exception result = null;
		int num = 0;
		newData.Clear();
		oldData.Clear();
		if (bspec)
		{
			specTableAdapter.Fill(oldData.Spec);
		}
		if (bstring)
		{
			stringTableAdapter.Fill(oldData.String);
		}
		if (sface.Length > 0)
		{
			faceListTableAdapter.Fill(newData.FaceList);
			faceListTableAdapter.Fill(oldData.FaceList);
			faceTableAdapter.Fill(oldData.Face);
		}
		if (bdept)
		{
			deptTableAdapter.Fill(oldData.Dept);
		}
		if (bclass)
		{
			classTableAdapter.Fill(oldData.Class);
		}
		if (bpLU)
		{
			pLUTableAdapter.Fill(oldData.PLU);
		}
		if (bbarcode)
		{
			barcodeTableAdapter.Fill(oldData.Barcode);
		}
		if (blabel)
		{
			labelTableAdapter.Fill(oldData.Label);
			labelItemTableAdapter.Fill(oldData.LabelItem);
		}
		if (bsalesman)
		{
			salesmanTableAdapter.Fill(oldData.Salesman);
		}
		if (bcustom1)
		{
			custom1TableAdapter.Fill(oldData.Custom1);
		}
		if (bcustom2)
		{
			custom2TableAdapter.Fill(oldData.Custom2);
		}
		if (bcustom3)
		{
			custom3TableAdapter.Fill(oldData.Custom3);
		}
		if (bcustom4)
		{
			custom4TableAdapter.Fill(oldData.Custom4);
		}
		if (bvip)
		{
			vipTableAdapter.Fill(oldData.VIP);
		}
		try
		{
			Cursor.Current = Cursors.WaitCursor;
			using (StreamReader streamReader = new StreamReader(fileName, Encoding.GetEncoding(codeType)))
			{
				while (streamReader.Peek() >= 0)
				{
					string text = streamReader.ReadLine();
					string[] array = text.Split('\t');
					if (array.Length == 0)
					{
						continue;
					}
					ECSDataSet.SpecRow specRow;
					ECSDataSet.StringRow stringRow;
					ECSDataSet.PLURow pLURow;
					switch (array[0])
					{
					case "TMS":
						if (!bspec)
						{
							break;
						}
						specRow = newData.Spec.NewSpecRow();
						try
						{
							specRow.SpecID = Program.ParseInt(array[1]);
							ECSDataSet.SpecRow specRow2 = oldData.Spec.FindBySpecID(specRow.SpecID);
							if (specRow2 != null)
							{
								if (!specRow2.Valid)
								{
									break;
								}
								specRow.Valid = true;
								goto IL_0361;
							}
							specRow.Valid = false;
							goto IL_0361;
							IL_0361:
							specRow.Value = Program.ParseInt(array[2]);
							goto IL_0376;
						}
						catch (IndexOutOfRangeException)
						{
							goto IL_0376;
						}
					case "TMT":
						if (!bstring)
						{
							break;
						}
						stringRow = newData.String.NewStringRow();
						try
						{
							stringRow.StringID = Program.ParseInt(array[1]);
							ECSDataSet.StringRow stringRow2 = oldData.String.FindByStringID(stringRow.StringID);
							if (stringRow2 != null)
							{
								if (!stringRow2.Valid)
								{
									break;
								}
								stringRow.Valid = true;
								goto IL_03e7;
							}
							stringRow.Valid = false;
							goto IL_03e7;
							IL_03e7:
							stringRow.Value = Program.ParseString(array[2]);
							goto IL_03fc;
						}
						catch (IndexOutOfRangeException)
						{
							goto IL_03fc;
						}
					case "SCP":
						if (sface.Length > 0)
						{
							ECSDataSet.FaceRow faceRow = newData.Face.NewFaceRow();
							try
							{
								faceRow.ScaleID = sface;
								faceRow.PageID = Program.ParseInt(array[1]);
								faceRow.KeyID = Program.ParseInt(array[2]);
								faceRow.PLUID = Program.ParseInt(array[3]);
							}
							catch (IndexOutOfRangeException)
							{
							}
							newData.Face.AddFaceRow(faceRow);
						}
						break;
					case "DPT":
						if (bdept)
						{
							ECSDataSet.DeptRow deptRow = newData.Dept.NewDeptRow();
							try
							{
								deptRow.DeptID = Program.ParseInt(array[1]);
								deptRow.Name = Program.ParseString(array[2]);
							}
							catch (IndexOutOfRangeException)
							{
							}
							if (!protect || deptRow.DeptID >= Settings.Default.minUserDeptID)
							{
								newData.Dept.AddDeptRow(deptRow);
							}
						}
						break;
					case "CLS":
						if (bclass)
						{
							ECSDataSet.ClassRow classRow = newData.Class.NewClassRow();
							try
							{
								classRow.ClassID = Program.ParseInt(array[1]);
								classRow.Name = Program.ParseString(array[2]);
								classRow.DeptID = Program.ParseInt(array[3]);
								classRow.LabelID1 = Program.ParseInt(array[4]);
								classRow.BarT1 = Program.ParseInt(array[5]);
								classRow.BarF1 = Program.ParseInt(array[6]);
								classRow.LabelID2 = Program.ParseInt(array[7]);
								classRow.BarT2 = Program.ParseInt(array[8]);
								classRow.BarF2 = Program.ParseInt(array[9]);
							}
							catch (IndexOutOfRangeException)
							{
							}
							if (!protect || classRow.ClassID >= Settings.Default.minUserClassID)
							{
								newData.Class.AddClassRow(classRow);
							}
						}
						break;
					case "PLU":
						if (!bpLU)
						{
							break;
						}
						pLURow = newData.PLU.NewPLURow();
						try
						{
							pLURow.PLUID = Program.ParseInt(array[1]);
							if (newData.PLU.FindByPLUID(pLURow.PLUID) != null)
							{
								break;
							}
							pLURow.Remark = Program.ParseInt(array[2]);
							pLURow.Index = Program.ParseString(array[3]);
							pLURow.UnitID = Program.ParseInt(array[4]);
							pLURow.Price = Program.ParseDecimal(array[5]);
							pLURow.Cost = Program.ParseDecimal(array[6]);
							pLURow.Tare = Program.ParseDecimal(array[7]);
							pLURow.LabelID1 = Program.ParseInt(array[8]);
							pLURow.BarT1 = Program.ParseInt(array[9]);
							pLURow.BarF1 = Program.ParseInt(array[10]);
							pLURow.LabelID2 = Program.ParseInt(array[11]);
							pLURow.BarT2 = Program.ParseInt(array[12]);
							pLURow.BarF2 = Program.ParseInt(array[13]);
							pLURow.ClassID = Program.ParseInt(array[14]);
							pLURow.Name = Program.ParseString(array[15]);
							pLURow.Text1 = Program.ParseString(array[16]);
							pLURow.Text2 = Program.ParseString(array[17]);
							pLURow.Text3 = Program.ParseString(array[18]);
							pLURow.Text4 = Program.ParseString(array[19]);
							pLURow.Text5 = Program.ParseString(array[20]);
							pLURow.Text6 = Program.ParseString(array[21]);
							pLURow.Text7 = Program.ParseString(array[22]);
							pLURow.PS_SD = Program.ParseInt(array[23]);
							pLURow.PS_ST = Program.ParseInt(array[24]);
							pLURow.PS_PD = Program.ParseInt(array[25]);
							pLURow.PS_PT = Program.ParseInt(array[26]);
							pLURow.PS_UD = Program.ParseInt(array[27]);
							pLURow.PC_SD = Program.ParseInt(array[28]);
							pLURow.PC_ST = Program.ParseInt(array[29]);
							pLURow.PC_PD = Program.ParseInt(array[30]);
							pLURow.PC_PT = Program.ParseInt(array[31]);
							pLURow.PC_UD = Program.ParseInt(array[32]);
							pLURow.DF_D = Program.ParseInt(array[33]);
							pLURow.DF_U = Program.ParseInt(array[34]);
							pLURow.DF_DN = Program.ParseDecimal(array[35]);
							pLURow.DF_UN = Program.ParseDecimal(array[36]);
							pLURow.DA_Sort1 = Program.ParseInt(array[37]);
							pLURow.DA_Day1 = Program.ParseInt(array[38]);
							pLURow.DA_Dn1 = Program.ParseDecimal(array[39]);
							pLURow.DA_Up1 = Program.ParseDecimal(array[40]);
							pLURow.DA_Num1 = Program.ParseDecimal(array[41]);
							pLURow.DA_Sort2 = Program.ParseInt(array[42]);
							pLURow.DA_Day2 = Program.ParseInt(array[43]);
							pLURow.DA_Dn2 = Program.ParseDecimal(array[44]);
							pLURow.DA_Up2 = Program.ParseDecimal(array[45]);
							pLURow.DA_Num2 = Program.ParseDecimal(array[46]);
							pLURow.DA_Sort3 = Program.ParseInt(array[47]);
							pLURow.DA_Day3 = Program.ParseInt(array[48]);
							pLURow.DA_Dn3 = Program.ParseDecimal(array[49]);
							pLURow.DA_Up3 = Program.ParseDecimal(array[50]);
							pLURow.DA_Num3 = Program.ParseDecimal(array[51]);
							pLURow.DA_Sort4 = Program.ParseInt(array[52]);
							pLURow.DA_Day4 = Program.ParseInt(array[53]);
							pLURow.DA_Dn4 = Program.ParseDecimal(array[54]);
							pLURow.DA_Up4 = Program.ParseDecimal(array[55]);
							pLURow.DA_Num4 = Program.ParseDecimal(array[56]);
							pLURow.TaxType = Program.ParseInt(array[57]);
							pLURow.Tax = Program.ParseInt(array[58]);
							pLURow.SspValue1 = Program.ParseInt(array[59]);
							pLURow.SspValue2 = Program.ParseInt(array[60]);
							pLURow.SspValue3 = Program.ParseInt(array[61]);
							pLURow.SspValue4 = Program.ParseInt(array[62]);
							pLURow.SType = Program.ParseInt(array[63]);
							pLURow.ALPHA = Program.ParseString(array[64]);
							pLURow.Flag = Program.ParseInt(array[65]);
							pLURow.Flag_Value = Program.ParseInt(array[66]);
							pLURow.Bitmap = Program.ParseInt(array[67]);
							goto IL_0a59;
						}
						catch (IndexOutOfRangeException)
						{
							goto IL_0a59;
						}
					case "BAR":
						if (bbarcode)
						{
							ECSDataSet.BarcodeRow barcodeRow = newData.Barcode.NewBarcodeRow();
							try
							{
								barcodeRow.BarID = Program.ParseInt(array[1]);
								barcodeRow.Name = Program.ParseString(array[2]);
								barcodeRow.Format = Program.ParseInt(array[3]);
								barcodeRow.Check = Program.ParseInt(array[4]);
								barcodeRow.Num1 = Program.ParseInt(array[5]);
								barcodeRow.Num2 = Program.ParseInt(array[6]);
								barcodeRow.TChar = array[7];
							}
							catch (IndexOutOfRangeException)
							{
							}
							if (!protect || barcodeRow.BarID >= Settings.Default.minUserBarcodeID)
							{
								newData.Barcode.AddBarcodeRow(barcodeRow);
							}
						}
						break;
					case "LAB":
						if (blabel)
						{
							ECSDataSet.LabelRow labelRow = newData.Label.NewLabelRow();
							try
							{
								labelRow.LabelID = Program.ParseInt(array[1]);
								labelRow.Name = Program.ParseString(array[2]);
								labelRow.Sort = Program.ParseInt(array[3]);
								labelRow.Width = Program.ParseInt(array[4]) * 8;
								labelRow.Height = Program.ParseInt(array[5]) * 8;
								labelRow.Text1 = Program.ParseString(array[6]);
								labelRow.Text2 = Program.ParseString(array[7]);
								labelRow.Text3 = Program.ParseString(array[8]);
								labelRow.Text4 = Program.ParseString(array[9]);
								labelRow.Text5 = Program.ParseString(array[10]);
								labelRow.Text6 = Program.ParseString(array[11]);
								labelRow.Text7 = Program.ParseString(array[12]);
								labelRow.Text8 = Program.ParseString(array[13]);
								labelRow.Text9 = Program.ParseString(array[14]);
								labelRow.Text10 = Program.ParseString(array[15]);
								labelRow.Text11 = Program.ParseString(array[16]);
								labelRow.Text12 = Program.ParseString(array[17]);
								labelRow.Text13 = Program.ParseString(array[18]);
								labelRow.Text14 = Program.ParseString(array[19]);
								labelRow.Text15 = Program.ParseString(array[20]);
								labelRow.Text16 = Program.ParseString(array[21]);
								labelRow.Version = Program.ParseInt(array[22]);
								labelRow.Text17 = Program.ParseString(array[23]);
								labelRow.Text18 = Program.ParseString(array[24]);
								labelRow.Text19 = Program.ParseString(array[25]);
								labelRow.Text20 = Program.ParseString(array[26]);
								labelRow.Text21 = Program.ParseString(array[27]);
								labelRow.Text22 = Program.ParseString(array[28]);
								labelRow.Text23 = Program.ParseString(array[29]);
								labelRow.Text24 = Program.ParseString(array[30]);
								labelRow.Text25 = Program.ParseString(array[31]);
								labelRow.Text26 = Program.ParseString(array[32]);
								labelRow.Text27 = Program.ParseString(array[33]);
								labelRow.Text28 = Program.ParseString(array[34]);
								labelRow.Text29 = Program.ParseString(array[35]);
								labelRow.Text30 = Program.ParseString(array[36]);
								labelRow.Text31 = Program.ParseString(array[37]);
								labelRow.Text32 = Program.ParseString(array[38]);
							}
							catch (IndexOutOfRangeException)
							{
							}
							if (!protect || labelRow.LabelID >= Settings.Default.minUserLabelID)
							{
								newData.Label.AddLabelRow(labelRow);
								oldData.Label.FindByLabelID(labelRow.LabelID)?.Delete();
								num = labelRow.LabelID;
							}
							else
							{
								num = 0;
							}
						}
						break;
					case "LAS":
						if (blabel && num > 0)
						{
							ECSDataSet.LabelItemRow labelItemRow = newData.LabelItem.NewLabelItemRow();
							try
							{
								labelItemRow.LabelID = num;
								labelItemRow.SubID = Program.ParseInt(array[1]);
								labelItemRow.Flag1 = Program.ParseInt(array[2]);
								labelItemRow.Flag2 = Program.ParseInt(array[3]);
								labelItemRow.Flag3 = Program.ParseInt(array[4]);
								labelItemRow.Print = Program.ParseInt(array[5]);
								labelItemRow.Angle = Program.ParseInt(array[6]);
								labelItemRow.Align = Program.ParseInt(array[7]);
								labelItemRow.Font = Program.ParseInt(array[8]);
								labelItemRow.Left = Program.ParseInt(array[9]);
								labelItemRow.Top = Program.ParseInt(array[10]);
								labelItemRow.Width = Program.ParseInt(array[11]);
								labelItemRow.Height = Program.ParseInt(array[12]);
							}
							catch (IndexOutOfRangeException)
							{
							}
							if (!protect || labelItemRow.LabelID >= Settings.Default.minUserLabelID)
							{
								newData.LabelItem.AddLabelItemRow(labelItemRow);
							}
						}
						break;
					case "SAL":
						if (bsalesman)
						{
							ECSDataSet.SalesmanRow salesmanRow = newData.Salesman.NewSalesmanRow();
							try
							{
								salesmanRow.SalesmanID = Program.ParseInt(array[1]);
								salesmanRow.Name = Program.ParseString(array[2]);
								salesmanRow.Password = Program.ParseString(array[3]);
								salesmanRow.Discount_Low = Program.ParseInt(array[4]);
								salesmanRow.Discount_High = Program.ParseInt(array[5]);
								salesmanRow.RightFB = Program.ParseInt(array[6]);
								salesmanRow.Code = Program.ParseString(array[7]);
							}
							catch (IndexOutOfRangeException)
							{
							}
							if (!protect || salesmanRow.SalesmanID >= Settings.Default.minUserSalesmanID)
							{
								newData.Salesman.AddSalesmanRow(salesmanRow);
							}
						}
						break;
					case "VIP":
					{
						if (!bvip)
						{
							break;
						}
						ECSDataSet.VIPRow vIPRow = newData.VIP.NewVIPRow();
						try
						{
							vIPRow.BAR = ((ulong)((long)Program.ParseInt(array[1]) * 1000000000L + Program.ParseInt(array[2]))).ToString();
							vIPRow.PH = ((ulong)((long)Program.ParseInt(array[3]) * 1000000000L + Program.ParseInt(array[4]))).ToString();
							vIPRow.Point = Program.ParseDecimal(array[5]);
							if (vIPRow.Point < 0m)
							{
								vIPRow.Point = 0m;
							}
							vIPRow.Discount = Program.ParseInt(array[6]);
						}
						catch (IndexOutOfRangeException)
						{
						}
						newData.VIP.AddVIPRow(vIPRow);
						break;
					}
					default:
						if (bcustom1)
						{
							DataSet_ReadTMS_OpenCustomRow(ref newData, custom1Row, array);
						}
						if (bcustom2)
						{
							DataSet_ReadTMS_OpenCustomRow(ref newData, custom2Row, array);
						}
						if (bcustom3)
						{
							DataSet_ReadTMS_OpenCustomRow(ref newData, custom3Row, array);
						}
						if (bcustom4)
						{
							DataSet_ReadTMS_OpenCustomRow(ref newData, custom4Row, array);
						}
						break;
					case "ECS":
					case "DWL":
					case "END":
					case "LAE":
						break;
						IL_0a59:
						if (!protect || pLURow.PLUID >= Settings.Default.minUserPLUID)
						{
							newData.PLU.AddPLURow(pLURow);
						}
						break;
						IL_03fc:
						newData.String.AddStringRow(stringRow);
						break;
						IL_0376:
						newData.Spec.AddSpecRow(specRow);
						break;
					}
				}
			}
			oldData.Merge(newData);
			if (bspec)
			{
				specTableAdapter.Update(oldData.Spec);
				Program.mf.DataSet_Update("Spec", DU_Form);
			}
			if (bstring)
			{
				stringTableAdapter.Update(oldData.String);
				Program.mf.DataSet_Update("String", DU_Form);
			}
			if (sface.Length > 0)
			{
				faceTableAdapter.Update(oldData.Face);
				Program.mf.DataSet_Update("Face", DU_Form);
			}
			if (bdept)
			{
				deptTableAdapter.Update(oldData.Dept);
				Program.mf.DataSet_Update("Dept", DU_Form);
			}
			if (bclass)
			{
				classTableAdapter.Update(oldData.Class);
				Program.mf.DataSet_Update("Class", DU_Form);
			}
			if (bpLU)
			{
				pLUTableAdapter.Update(oldData.PLU);
				Program.mf.DataSet_Update("PLU", DU_Form);
			}
			if (bbarcode)
			{
				barcodeTableAdapter.Update(oldData.Barcode);
				Program.mf.DataSet_Update("Barcode", DU_Form);
			}
			if (blabel)
			{
				labelTableAdapter.Update(oldData.Label);
				labelItemTableAdapter.Update(oldData.LabelItem);
				Program.mf.DataSet_Update("Label", DU_Form);
			}
			if (bsalesman)
			{
				salesmanTableAdapter.Update(oldData.Salesman);
				Program.mf.DataSet_Update("Salesman", DU_Form);
			}
			if (bvip)
			{
				vipTableAdapter.Update(oldData.VIP);
				Program.mf.DataSet_Update("VIP", DU_Form);
			}
			if (bcustom1)
			{
				custom1TableAdapter.Update(oldData.Custom1);
				Program.mf.DataSet_Update("Custom1", DU_Form);
			}
			if (bcustom2)
			{
				custom2TableAdapter.Update(oldData.Custom2);
				Program.mf.DataSet_Update("Custom2", DU_Form);
			}
			if (bcustom3)
			{
				custom3TableAdapter.Update(oldData.Custom3);
				Program.mf.DataSet_Update("Custom3", DU_Form);
			}
			if (bcustom4)
			{
				custom4TableAdapter.Update(oldData.Custom4);
				Program.mf.DataSet_Update("Custom4", DU_Form);
			}
			result = null;
		}
		catch (Exception ex12)
		{
			result = ex12;
		}
		finally
		{
			Cursor.Current = Cursors.Default;
		}
		return result;
	}

	public static void DataSet_Init()
	{
		bool flag = false;
		string fileName = Application.StartupPath + "\\Combo.xml";
		uiDataSet.SimCombo.ReadXml(fileName);
		DataSet_Init_FindCustom();
		DateSet_GetNew("Spec");
		if (eCSDataSet.Spec.Count == 0)
		{
			string text = Application.StartupPath + "\\Config\\" + Settings.Default.configFolder + "\\";
			string fileName2 = text + "_ECS.TMS";
			ECSDataSet oldData = new ECSDataSet();
			DataSet_ReadTMS(ref eCSDataSet, ref oldData, "utf-8", fileName2, "#NULL#", protect: false, bspec: true, bstring: true, "", bdept: true, bclass: true, bpLU: true, bbarcode: true, blabel: true, bsalesman: true, bvip: true, bcustom1: true, bcustom2: true, bcustom3: true, bcustom4: true);
			DataSet_Init_Unit(ref eCSDataSet);
			unitTableAdapter.Update(eCSDataSet.Unit);
			eCSDataSet.Clear();
			oldData.Dispose();
		}
		else
		{
			DataSet_Init_Unit(ref eCSDataSet);
		}
		DateSet_GetNew("PLU");
		stockItemTableAdapter.FillPart(reportDataSet.StockItem);
		stockTableAdapter.Fill(reportDataSet.Stock);
		deviceTableAdapter.Fill(reportDataSet.Device);
		historyTableAdapter.Fill(reportDataSet.History);
		History_DT = reportDataSet.History.FindByFileName("this").Start;
		sGroupTableAdapter.Fill(reportDataSet.SGroup);
		ReportDataSet.SGroupRow sGroupRow = reportDataSet.SGroup.FindByGID(0);
		if (sGroupRow == null)
		{
			ReportDataSet.SGroupRow sGroupRow2 = reportDataSet.SGroup.NewSGroupRow();
			sGroupRow2.GID = 0;
			sGroupRow2.Name = Program.GetLang("pw_NoSale");
			reportDataSet.SGroup.AddSGroupRow(sGroupRow2);
			flag = true;
		}
		else if (sGroupRow.Name != Program.GetLang("pw_NoSale"))
		{
			sGroupRow.Name = Program.GetLang("pw_NoSale");
			flag = true;
		}
		sGroupRow = reportDataSet.SGroup.FindByGID(1);
		if (sGroupRow == null)
		{
			ReportDataSet.SGroupRow sGroupRow3 = reportDataSet.SGroup.NewSGroupRow();
			sGroupRow3.GID = 1;
			sGroupRow3.Name = Program.GetLang("pw_Default");
			reportDataSet.SGroup.AddSGroupRow(sGroupRow3);
			flag = true;
		}
		else if (sGroupRow.Name != Program.GetLang("pw_Default"))
		{
			sGroupRow.Name = Program.GetLang("pw_Default");
			flag = true;
		}
		if (flag)
		{
			sGroupTableAdapter.Update(reportDataSet.SGroup);
		}
		faceListTableAdapter.Fill(eCSDataSet.FaceList);
		faceTableAdapter.Fill(eCSDataSet.Face);
		if (eCSDataSet.FaceList.Count == 0)
		{
			eCSDataSet.Face.Clear();
			Program.Public_Cal_NewSCP(ref eCSDataSet, Program.GetLang("pw_Default"));
			faceListTableAdapter.Update(eCSDataSet.FaceList);
			faceTableAdapter.Update(eCSDataSet.Face);
		}
		Stocked = (Stocked_PClog = false);
		rLogsTypeTableAdapter.Fill(reportDataSet.rLogsType);
		string[] array = uiDataSet.SimCombo.FindByName("Logs Type Full").ValueDisplay.Split('|');
		SimComboVD_No[] array2 = new SimComboVD_No[array.Length / 2];
		SimComboVD_No[] array3 = new SimComboVD_No[array.Length / 2];
		for (int i = 0; i < array.Length / 2; i++)
		{
			SimComboVD_No simComboVD_No = new SimComboVD_No();
			simComboVD_No.Value = int.Parse(array[i * 2]);
			simComboVD_No.Display = array[i * 2 + 1];
			array2[i] = (array3[i] = simComboVD_No);
			ReportDataSet.rLogsTypeRow rLogsTypeRow = reportDataSet.rLogsType.FindByTypeID(simComboVD_No.Value);
			if (rLogsTypeRow == null)
			{
				rLogsTypeRow = reportDataSet.rLogsType.NewrLogsTypeRow();
				rLogsTypeRow.TypeID = simComboVD_No.Value;
				rLogsTypeRow.Name = simComboVD_No.Display;
				reportDataSet.rLogsType.AddrLogsTypeRow(rLogsTypeRow);
			}
			else
			{
				rLogsTypeRow.Name = simComboVD_No.Display;
			}
		}
		rLogsTypeTableAdapter.Update(reportDataSet.rLogsType);
		rStockTypeTableAdapter.Fill(reportDataSet.rStockType);
		array = uiDataSet.SimCombo.FindByName("Stock Type Full").ValueDisplay.Split('|');
		SimComboVD_No[] array4 = new SimComboVD_No[array.Length / 2];
		for (int j = 0; j < array.Length / 2; j++)
		{
			SimComboVD_No simComboVD_No2 = new SimComboVD_No();
			simComboVD_No2.Value = int.Parse(array[j * 2]);
			simComboVD_No2.Display = array[j * 2 + 1];
			array4[j] = simComboVD_No2;
			ReportDataSet.rStockTypeRow rStockTypeRow = reportDataSet.rStockType.FindByTypeID(simComboVD_No2.Value);
			if (rStockTypeRow == null)
			{
				rStockTypeRow = reportDataSet.rStockType.NewrStockTypeRow();
				rStockTypeRow.TypeID = simComboVD_No2.Value;
				rStockTypeRow.Name = simComboVD_No2.Display;
				reportDataSet.rStockType.AddrStockTypeRow(rStockTypeRow);
			}
			else
			{
				rStockTypeRow.Name = simComboVD_No2.Display;
			}
		}
		rStockTypeTableAdapter.Update(reportDataSet.rStockType);
	}

	private static void DataSet_Stock_Reject()
	{
		stockItemTableAdapter.ClearBeforeFill = true;
		stockTableAdapter.ClearBeforeFill = true;
		stockItemTableAdapter.FillPart(reportDataSet.StockItem);
		stockTableAdapter.Fill(reportDataSet.Stock);
	}

	private static void DataSet_Stock_Reflush()
	{
		if (!Stocked)
		{
			return;
		}
		try
		{
			stockItemTableAdapter.Update(reportDataSet.StockItem);
			stockTableAdapter.Update(reportDataSet.Stock);
		}
		catch (Exception)
		{
			stockItemTableAdapter.ClearBeforeFill = true;
			stockTableAdapter.ClearBeforeFill = true;
			stockItemTableAdapter.FillPart(reportDataSet.StockItem);
			stockTableAdapter.Fill(reportDataSet.Stock);
		}
		finally
		{
			Stocked = false;
		}
	}

	public static void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "RDS");
	}

	public static void DataSet_Refresh(string Type)
	{
		switch (Type)
		{
		case "PLU":
			nb_PLU = false;
			break;
		case "Barcode":
			nb_Barcode = false;
			break;
		case "Class":
			nb_Class = false;
			break;
		case "CoPLU_BoxPcs":
			nb_CoPLU_BoxPcs = false;
			break;
		case "CoPLU_ProMat":
			nb_CoPLU_ProMat = false;
			break;
		case "Custom1":
			nb_Custom1 = false;
			break;
		case "Custom2":
			nb_Custom2 = false;
			break;
		case "Custom3":
			nb_Custom3 = false;
			break;
		case "Custom4":
			nb_Custom4 = false;
			break;
		case "Dept":
			nb_Dept = false;
			break;
		case "Face":
			nb_Face = false;
			break;
		case "Label":
			nb_Label = false;
			break;
		case "Salesman":
			nb_Salesman = false;
			break;
		case "Spec":
			nb_Spec = false;
			break;
		case "String":
			nb_String = false;
			break;
		case "VIP":
			nb_VIP = false;
			break;
		}
	}

	private static bool Stock_Add(int pType, int pGID, string pMAC, int pFID, int pSubID, DateTime pDateTime, int pPLU, int pUnit, decimal pAmount, decimal pUnitPrice, decimal pPrice, int fix0nU1nT2, bool isPC = false)
	{
		try
		{
			ECSDataSet.PLURow pLURow = eCSDataSet.PLU.FindByPLUID(pPLU);
			if (fix0nU1nT2 != 0)
			{
				if (pType == 13 || pType == 14 || pType == 12 || pType == 253 || pType == 254)
				{
					pUnitPrice = (pPrice = 0m);
				}
				else
				{
					if (pType != 252)
					{
						pAmount = Math.Abs(pAmount);
						pUnitPrice = Math.Abs(pUnitPrice);
						pPrice = Math.Abs(pPrice);
					}
					switch (fix0nU1nT2)
					{
					case 2:
						pPrice = Calculate_TotalPrice(pUnitPrice, pAmount);
						break;
					case 1:
						pUnitPrice = Calculate_UnitPrice(pPrice, pAmount);
						break;
					}
					if (pType == 1 || pType == 10)
					{
						pAmount = -pAmount;
						pPrice = -pPrice;
					}
				}
			}
			if (string.IsNullOrEmpty(pMAC))
			{
				pMAC = "PC-" + pGID;
			}
			if (isPC)
			{
				ReportDataSet.DeviceRow deviceRow = reportDataSet.Device.FindByMAC(pMAC);
				if (deviceRow == null)
				{
					deviceRow = reportDataSet.Device.NewDeviceRow();
					deviceRow.MAC = pMAC;
					deviceRow.Name = pMAC;
					deviceRow.GID = pGID;
					deviceRow.FIDed = 1;
					reportDataSet.Device.AddDeviceRow(deviceRow);
				}
				else
				{
					deviceRow.FIDed++;
				}
				ECSDataSet.PLURow pLURow2 = eCSDataSet.PLU.FindByPLUID(pPLU);
				ReportDataSet.LogRow logRow = reportDataSet.Log.NewLogRow();
				logRow.MAC = pMAC;
				int num = (logRow.FID = deviceRow.FIDed);
				pFID = num;
				logRow.DateTime = pDateTime;
				logRow.SID = 1;
				logRow.Salesman = 0;
				decimal num2 = (logRow.Payment_Other_3 = 0m);
				decimal num4 = (logRow.Payment_Other_2 = num2);
				decimal num6 = (logRow.Payment_Other_1 = num4);
				decimal num8 = (logRow.Payment_Card = num6);
				decimal disRound = (logRow.Sfee = num8);
				logRow.DisRound = disRound;
				reportDataSet.Log.AddLogRow(logRow);
				ReportDataSet.LogItemRow logItemRow = reportDataSet.LogItem.NewLogItemRow();
				logItemRow.MAC = logRow.MAC;
				logItemRow.FID = logRow.FID;
				int num11 = (logItemRow.SubID = 1);
				pSubID = num11;
				decimal num13 = (decimal)pLURow.Tax / 10000m;
				if (pLURow.TaxType == 1)
				{
					logItemRow.Tax = Calculate_TotalPrice(pPrice, num13);
					pPrice += logItemRow.Tax;
				}
				else if (pLURow.TaxType == 2)
				{
					logItemRow.Tax = Calculate_TotalPrice(pPrice, num13);
				}
				else if (pLURow.TaxType == 3)
				{
					logItemRow.Tax = Calculate_TotalPrice(pPrice / (num13 + 1m), num13);
				}
				else
				{
					logItemRow.Tax = 0m;
				}
				logItemRow.Price = pPrice;
				logItemRow.PLU = pPLU;
				logItemRow.Class = pLURow2?.ClassID ?? 9;
				logItemRow.Dept = eCSDataSet.Class.FindByClassID(logItemRow.Class)?.DeptID ?? 9;
				logItemRow.Cost = ((pLURow2 == null) ? 0m : Calculate_TotalPrice(pLURow2.Cost, pAmount));
				logItemRow.Amount = pAmount;
				logItemRow.Unit = pUnit;
				logItemRow.Type = pType;
				string text = (logItemRow.Text4 = "");
				string text3 = (logItemRow.Text3 = text);
				string text5 = (logItemRow.Text2 = text3);
				logItemRow.Text1 = text5;
				logItemRow.UnitPrice = pUnitPrice;
				logItemRow.CoFID = 0;
				logItemRow.PLUName = ((pLURow2 == null) ? "" : pLURow2.Name);
				reportDataSet.LogItem.AddLogItemRow(logItemRow);
				logRow.SubNo = logItemRow.SubID;
				logRow.Cost = logItemRow.Cost;
				logRow.Payment_Total = logItemRow.Price;
				logRow.Tax = logItemRow.Tax;
				Stocked_PClog = true;
			}
			DataRow[] array = eCSDataSet.CoPLU_ProMat.Select($"[PLUID_Product] = '{pPLU}'");
			if (array.Length > 0)
			{
				if (pType == 0 || pType == 1)
				{
					decimal[] array2 = new decimal[array.Length];
					decimal[] array3 = new decimal[array.Length];
					int[] array4 = new int[array.Length];
					int[] array5 = new int[array.Length];
					decimal num15;
					decimal num14 = (num15 = 0m);
					for (int i = 0; i < array.Length; i++)
					{
						array5[i] = (int)array[i]["PLUID_Material"];
						ECSDataSet.PLURow pLURow3 = eCSDataSet.PLU.FindByPLUID(array5[i]);
						if (pUnit == 2)
						{
							array4[i] = ((pLURow3 == null || pLURow3.UnitID <= 1) ? Settings.Default.Report_DefaultWeight : pLURow3.UnitID);
						}
						else
						{
							array4[i] = pUnit;
						}
						ref decimal reference = ref array2[i];
						reference = pAmount * (decimal)array[i]["Multi"];
						ref decimal reference2 = ref array3[i];
						reference2 = Calculate_TotalPrice(array2[i], pLURow3?.Cost ?? 0m);
						if (array3[i] == 0m)
						{
							++num15;
						}
						else
						{
							num14 += array3[i];
						}
					}
					decimal num16 = pPrice;
					for (int i = 0; i < array.Length; i++)
					{
						decimal num17;
						if (i == array.Length - 1)
						{
							num17 = num16;
						}
						else
						{
							num17 = Calculate_GoPrice(pPrice * array3[i] / num14);
							num16 -= num17;
						}
						if (!Stock_Add(252, pGID, pMAC, pFID, pSubID, pDateTime, array5[i], array4[i], array2[i], 0m, num17, 1))
						{
							return false;
						}
					}
					return true;
				}
				return true;
			}
			if (pType == 0 || pType == 11 || pType == 1 || pType == 10 || pType == 13 || pType == 14 || pType == 12 || pType == 252 || pType == 253 || pType == 254)
			{
				bool flag = false;
				ReportDataSet.StockItemRow stockItemRow = reportDataSet.StockItem.NewStockItemRow();
				stockItemRow.GID = pGID;
				stockItemRow.MAC = pMAC;
				stockItemRow.FID = pFID;
				stockItemRow.SubID = pSubID;
				stockItemRow.DateTime = pDateTime;
				stockItemRow.Type = pType;
				stockItemRow.PLU = pPLU;
				stockItemRow.Unit = pUnit;
				if (pType == 0 || pType == 11 || pType == 1 || pType == 10 || pType == 14 || pType == 252 || pType == 253 || pType == 254)
				{
					pAmount = -pAmount;
				}
				stockItemRow.Amount = pAmount;
				stockItemRow.UnitPrice = pUnitPrice;
				stockItemRow.Price = pPrice;
				reportDataSet.StockItem.AddStockItemRow(stockItemRow);
				ReportDataSet.StockRow stockRow = reportDataSet.Stock.FindByGIDPLU(stockItemRow.GID, stockItemRow.PLU);
				if (stockRow == null)
				{
					stockRow = reportDataSet.Stock.NewStockRow();
					stockRow.GID = stockItemRow.GID;
					stockRow.PLU = stockItemRow.PLU;
					ReportDataSet.StockRow stockRow2 = stockRow;
					ReportDataSet.StockRow stockRow3 = stockRow;
					ReportDataSet.StockRow stockRow4 = stockRow;
					ReportDataSet.StockRow stockRow5 = stockRow;
					ReportDataSet.StockRow stockRow6 = stockRow;
					ReportDataSet.StockRow stockRow7 = stockRow;
					decimal num18 = (stockRow.In_Money = 0m);
					decimal num20 = (stockRow7.SpoilageSP = num18);
					decimal num22 = (stockRow6.Spoilage = num20);
					decimal num24 = (stockRow5.In_AmountSP = num22);
					decimal num26 = (stockRow4.In_Amount = num24);
					decimal amount = (stockRow3.AmountSP = num26);
					stockRow2.Amount = amount;
					ReportDataSet.StockRow stockRow8 = stockRow;
					int unit = (stockRow.UnitSP = 0);
					stockRow8.Unit = unit;
					stockRow.SafetyStock = 0m;
					stockRow.Sped = false;
					stockRow.STakingTime = new DateTime(2000, 1, 1, 0, 0, 0);
					reportDataSet.Stock.AddStockRow(stockRow);
				}
				ECSDataSet.UnitRow unitRow = null;
				int num30 = 0;
				if (pLURow != null)
				{
					num30 = ((pLURow.UnitID <= 1) ? Settings.Default.Report_DefaultWeight : pLURow.UnitID);
					unitRow = eCSDataSet.Unit.FindByUnitID(num30);
				}
				ECSDataSet.UnitRow unitRow2 = eCSDataSet.Unit.FindByUnitID(stockItemRow.Unit);
				if (unitRow2 == null && stockItemRow.Unit >= 20)
				{
					unitRow2 = eCSDataSet.Unit.FindByUnitID(2);
				}
				if (unitRow2 == null)
				{
					return false;
				}
				bool flag2 = false;
				if (pLURow != null && unitRow != null)
				{
					if (stockRow.Unit != num30)
					{
						ECSDataSet.UnitRow unitRow3 = eCSDataSet.Unit.FindByUnitID(stockRow.Unit);
						if (stockRow.Unit == 0)
						{
							stockRow.Amount = 0m;
							stockRow.In_Amount = 0m;
							stockRow.Spoilage = 0m;
						}
						else if (unitRow3.Punit == unitRow.Punit)
						{
							stockRow.Amount = Math.Round(stockRow.Amount * unitRow3.Pack / unitRow.Pack, Settings.Default.Format_Weight);
							stockRow.In_Amount = Math.Round(stockRow.In_Amount * unitRow3.Pack / unitRow.Pack, Settings.Default.Format_Weight);
							stockRow.Spoilage = Math.Round(stockRow.Spoilage * unitRow3.Pack / unitRow.Pack, Settings.Default.Format_Weight);
						}
						else
						{
							decimal amountSP = stockRow.AmountSP;
							decimal in_AmountSP = stockRow.In_AmountSP;
							decimal spoilageSP = stockRow.SpoilageSP;
							int unitSP = stockRow.UnitSP;
							stockRow.Sped = true;
							stockRow.AmountSP = stockRow.Amount;
							stockRow.In_AmountSP = stockRow.In_Amount;
							stockRow.SpoilageSP = stockRow.Spoilage;
							stockRow.UnitSP = stockRow.Unit;
							stockRow.Amount = amountSP;
							stockRow.In_Amount = in_AmountSP;
							stockRow.Spoilage = spoilageSP;
							stockRow.Unit = unitSP;
							if (unitSP == 0)
							{
								stockRow.Amount = 0m;
								stockRow.In_Amount = 0m;
								stockRow.Spoilage = 0m;
							}
							else
							{
								stockRow.Amount = Math.Round(stockRow.Amount * unitRow3.Pack / unitRow.Pack, Settings.Default.Format_Weight);
								stockRow.In_Amount = Math.Round(stockRow.In_Amount * unitRow3.Pack / unitRow.Pack, Settings.Default.Format_Weight);
								stockRow.Spoilage = Math.Round(stockRow.Spoilage * unitRow3.Pack / unitRow.Pack, Settings.Default.Format_Weight);
							}
						}
						stockRow.Unit = num30;
					}
					ECSDataSet.UnitRow unitRow4 = eCSDataSet.Unit.FindByUnitID(stockRow.Unit);
					if (unitRow2 == unitRow4)
					{
						flag2 = false;
					}
					else if (unitRow2.Punit == unitRow4.Punit)
					{
						stockItemRow.UnitPrice = Math.Round(stockItemRow.UnitPrice * unitRow.Pack / unitRow2.Pack, Settings.Default.Format_Price);
						stockItemRow.Amount = Math.Round(stockItemRow.Amount * unitRow2.Pack / unitRow.Pack, Settings.Default.Format_Weight);
						stockItemRow.Unit = num30;
						flag2 = false;
					}
					else
					{
						if (stockRow.UnitSP == 0)
						{
							stockRow.AmountSP = 0m;
							stockRow.In_AmountSP = 0m;
							stockRow.SpoilageSP = 0m;
						}
						else
						{
							ECSDataSet.UnitRow unitRow5 = eCSDataSet.Unit.FindByUnitID(stockRow.UnitSP);
							stockRow.AmountSP = Math.Round(stockRow.AmountSP * unitRow5.Pack / unitRow2.Pack, Settings.Default.Format_Weight);
							stockRow.In_AmountSP = Math.Round(stockRow.In_AmountSP * unitRow5.Pack / unitRow2.Pack, Settings.Default.Format_Weight);
							stockRow.SpoilageSP = Math.Round(stockRow.SpoilageSP * unitRow5.Pack / unitRow2.Pack, Settings.Default.Format_Weight);
						}
						stockRow.UnitSP = stockItemRow.Unit;
						flag2 = true;
					}
				}
				else if (stockRow.Unit == 0)
				{
					stockRow.Amount = 0m;
					stockRow.In_Amount = 0m;
					stockRow.Spoilage = 0m;
					stockRow.Unit = unitRow2.UnitID;
					flag2 = false;
				}
				else if (stockRow.Unit == stockItemRow.Unit)
				{
					flag2 = false;
				}
				else
				{
					ECSDataSet.UnitRow unitRow6 = eCSDataSet.Unit.FindByUnitID(stockRow.Unit);
					if (unitRow6.Punit == unitRow2.Punit)
					{
						stockRow.Amount = Math.Round(stockRow.AmountSP * unitRow6.Pack / unitRow2.Pack, Settings.Default.Format_Weight);
						stockRow.In_Amount = Math.Round(stockRow.In_AmountSP * unitRow6.Pack / unitRow2.Pack, Settings.Default.Format_Weight);
						stockRow.Spoilage = Math.Round(stockRow.SpoilageSP * unitRow6.Pack / unitRow2.Pack, Settings.Default.Format_Weight);
						stockRow.Unit = stockItemRow.Unit;
						flag2 = false;
					}
					else
					{
						ECSDataSet.UnitRow unitRow7 = eCSDataSet.Unit.FindByUnitID(stockRow.UnitSP);
						if (unitRow7 == null)
						{
							unitRow7 = eCSDataSet.Unit.FindByUnitID(stockItemRow.Unit);
						}
						stockRow.AmountSP = Math.Round(stockRow.AmountSP * unitRow7.Pack / unitRow2.Pack, Settings.Default.Format_Weight);
						stockRow.In_AmountSP = Math.Round(stockRow.In_AmountSP * unitRow7.Pack / unitRow2.Pack, Settings.Default.Format_Weight);
						stockRow.SpoilageSP = Math.Round(stockRow.SpoilageSP * unitRow7.Pack / unitRow2.Pack, Settings.Default.Format_Weight);
						stockRow.UnitSP = stockItemRow.Unit;
						flag2 = true;
					}
				}
				switch (pType)
				{
				case 12:
					if (stockRow.STakingTime < stockItemRow.DateTime)
					{
						stockRow.STakingTime = stockItemRow.DateTime;
						if (flag2)
						{
							stockRow.Sped = true;
							stockRow.SpoilageSP += stockRow.AmountSP - stockItemRow.Amount;
							stockRow.AmountSP = stockItemRow.Amount;
						}
						else
						{
							stockRow.Spoilage += stockRow.Amount - stockItemRow.Amount;
							stockRow.Amount = stockItemRow.Amount;
						}
					}
					break;
				case 13:
					stockRow.Order += stockItemRow.Amount;
					break;
				case 14:
					stockRow.In_Amount += stockItemRow.Amount;
					if (stockRow.STakingTime < stockItemRow.DateTime)
					{
						stockRow.Amount += stockItemRow.Amount;
						stockRow.Spoilage -= stockItemRow.Amount;
					}
					break;
				default:
					if (flag2)
					{
						stockRow.Sped = true;
						stockRow.In_AmountSP += stockItemRow.Amount;
						if (stockRow.STakingTime < stockItemRow.DateTime)
						{
							stockRow.AmountSP += stockItemRow.Amount;
						}
						else
						{
							stockRow.SpoilageSP += stockItemRow.Amount;
						}
					}
					else
					{
						stockRow.In_Amount += stockItemRow.Amount;
						if (stockRow.STakingTime < stockItemRow.DateTime || pType == 253 || pType == 254)
						{
							stockRow.Amount += stockItemRow.Amount;
						}
						else
						{
							stockRow.Spoilage += stockItemRow.Amount;
						}
						if (unitRow2.Punit == 2 && (pType == 0 || pType == 11))
						{
							flag = true;
						}
					}
					stockRow.In_Money += stockItemRow.Price;
					break;
				}
				stockRow.LowStock = stockRow.Amount < stockRow.SafetyStock;
				stockRow.KID = stockItemRow.KID;
				stockRow.KID_Time = DateTime.Now;
				if (flag && (pType == 0 || pType == 11) && stockRow.Amount < 0m)
				{
					Stock_Req_Unpack(pGID, stockRow.PLU, (int)decimal.Ceiling(-stockRow.Amount));
				}
			}
		}
		catch (Exception ex)
		{
			Log_Error(Program.GetLang("pw_ParseError") + ": Stock Item Unknown," + ex.Message + ',' + ex.Source + ',' + $"GID={pGID}, MAC={pMAC}, Type={pType}");
			return false;
		}
		Stocked = true;
		return true;
	}

	private static int Stock_Req_Unpack(int pGID, int pPLU, int amount)
	{
		int num = 0;
		DataRow[] array = eCSDataSet.CoPLU_BoxPcs.Select($"[PLUID_Pcs] = '{pPLU}'");
		for (int i = 0; i < array.Length; i++)
		{
			int num2 = (int)array[i]["PLUID_Box"];
			int num3 = (int)array[i]["Multi"];
			int num4 = 0;
			ReportDataSet.StockRow stockRow = reportDataSet.Stock.FindByGIDPLU(pGID, num2);
			if (stockRow != null)
			{
				num4 = (int)decimal.Floor(stockRow.Amount);
			}
			int num5 = (amount - num + num3 - 1) / num3;
			if (num4 < num5)
			{
				num5 = Stock_Req_Unpack(pGID, num2, num5 - num4) + num4;
			}
			if (num5 > 0)
			{
				Stock_Add(254, pGID, "", 0, 0, DateTime.Now, num2, eCSDataSet.PLU.FindByPLUID(num2).UnitID, num5, 0m, 0m, 0);
				Stock_Add(253, pGID, "", 0, 0, DateTime.Now, pPLU, eCSDataSet.PLU.FindByPLUID(pPLU).UnitID, -num5 * num3, 0m, 0m, 0);
			}
			num += num5 * num3;
			if (num >= amount)
			{
				return amount;
			}
		}
		return num;
	}

	public static void SGroup_Remove(int ctGID)
	{
		ReportDataSet.SGroupRow sGroupRow = reportDataSet.SGroup.FindByGID(ctGID);
		if (sGroupRow != null)
		{
			sGroupTableAdapter.DeleteGID(ctGID);
			DataSet_Stock_Reject();
			sGroupTableAdapter.ClearBeforeFill = true;
			sGroupTableAdapter.Fill(reportDataSet.SGroup);
			DataSet_Update("Report");
		}
	}

	public static void NL_DeviceAdd(string deviceName, string mac, int ctGID, string ctString)
	{
		bool flag = false;
		if (ctGID >= 0 && reportDataSet.SGroup.FindByGID(ctGID) == null)
		{
			ReportDataSet.SGroupRow sGroupRow = reportDataSet.SGroup.NewSGroupRow();
			sGroupRow.GID = ctGID;
			if (ctGID >= 2 && (ctString == Program.GetLang("pw_Default") || ctString == Program.GetLang("pw_NoSale")))
			{
				ctString = ctString + "-" + ctGID;
			}
			sGroupRow.Name = ctString;
			reportDataSet.SGroup.AddSGroupRow(sGroupRow);
			sGroupTableAdapter.Update(reportDataSet.SGroup);
			flag = true;
		}
		if (mac != null || deviceName != null)
		{
			ReportDataSet.DeviceRow deviceRow = reportDataSet.Device.FindByMAC(mac);
			if (deviceRow == null)
			{
				if (ctGID >= 0)
				{
					deviceRow = reportDataSet.Device.NewDeviceRow();
					deviceRow.MAC = mac;
					deviceRow.Name = deviceName;
					deviceRow.GID = ctGID;
					reportDataSet.Device.AddDeviceRow(deviceRow);
					deviceTableAdapter.Update(reportDataSet.Device);
					flag = true;
					DataSet_Update("Device");
				}
			}
			else if (deviceRow.GID != ctGID && ctGID >= 0)
			{
				deviceRow.Name = deviceName;
				deviceRow.GID = ctGID;
				deviceTableAdapter.Update(reportDataSet.Device);
				flag = true;
				DataSet_Update("Device");
			}
			else if (deviceRow.Name != deviceName)
			{
				deviceRow.Name = deviceName;
				deviceTableAdapter.Update(reportDataSet.Device);
				flag = true;
				DataSet_Update("Device");
			}
		}
		if (flag)
		{
			DataSet_Update("Report");
		}
	}

	public static Exception FK_DeviceAdd(string deviceName, string mac, int ctGID, string ctString)
	{
		try
		{
			Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
		}
		catch (ApplicationException result)
		{
			return result;
		}
		Exception ex = null;
		try
		{
			NL_DeviceAdd(deviceName, mac, ctGID, ctString);
		}
		catch (Exception ex2)
		{
			ex = ex2;
		}
		finally
		{
			Program.reportLock.ReleaseWriterLock();
		}
		if (ex != null)
		{
			DataSet_Stock_Reject();
		}
		return ex;
	}

	public static bool NL_DeviceAdd_FromDeviceSel(string deviceName, string mac, int ctGID, string ctString, bool ctNew)
	{
		if (ctNew)
		{
			ctGID = 1;
			if (ctString.Length == 0)
			{
				return false;
			}
			foreach (ReportDataSet.SGroupRow item in reportDataSet.SGroup)
			{
				if (item.Name == ctString)
				{
					return false;
				}
				if (ctGID < item.GID)
				{
					ctGID = item.GID;
				}
			}
			ctGID++;
		}
		else
		{
			if (ctGID < 0)
			{
				return false;
			}
			ReportDataSet.SGroupRow sGroupRow2 = reportDataSet.SGroup.FindByGID(ctGID);
			if (sGroupRow2 == null)
			{
				return false;
			}
		}
		NL_DeviceAdd(deviceName, mac, ctGID, ctString);
		return true;
	}

	public static Exception FK_DeviceAdd_FromDeviceSel(string deviceName, string mac, int ctGID, string ctString, bool ctNew)
	{
		if (ctNew)
		{
			ctGID = 1;
			if (ctString.Length == 0)
			{
				return null;
			}
			foreach (ReportDataSet.SGroupRow item in reportDataSet.SGroup)
			{
				if (item.Name == ctString)
				{
					return new ApplicationException(Program.GetLang("pw_ExistStock"));
				}
				if (ctGID < item.GID)
				{
					ctGID = item.GID;
				}
			}
			ctGID++;
		}
		else
		{
			if (ctGID < 0)
			{
				return null;
			}
			ReportDataSet.SGroupRow sGroupRow2 = reportDataSet.SGroup.FindByGID(ctGID);
			if (sGroupRow2 == null)
			{
				return null;
			}
		}
		return FK_DeviceAdd(deviceName, mac, ctGID, ctString);
	}

	public static void Log_Info(string Info)
	{
		if (Settings.Default.FXP_Logs_Report)
		{
			Program.WriteFileLine("LogInfo.txt", Info);
		}
	}

	public static void Log_Error(string Error)
	{
		if (Settings.Default.FXP_Logs_Report)
		{
			Program.WriteFileLine("LogError.txt", Error);
		}
	}

	public static void PLUImportKeep_Get()
	{
		int[] pLUImportKeep_Para = new int[36];
		PLUImportKeep_Para = pLUImportKeep_Para;
		char[] array = Settings.Default.PLUImportKeep.ToCharArray();
		PLUImportKeep_Some = false;
		for (int i = 0; i < array.Length && i < 36; i++)
		{
			if (array[i] >= '0' && array[i] <= '2')
			{
				PLUImportKeep_Para[i] = array[i] - 48;
				if (PLUImportKeep_Para[i] > 0)
				{
					PLUImportKeep_Some = true;
				}
			}
		}
	}

	public static void NL_PLUImportKeep(ECSDataSet.PLURow prow)
	{
		bool flag = false;
		if (PLUImportKeep_Some)
		{
			DateSet_GetNew("PLU");
			ECSDataSet.PLURow pLURow = eCSDataSet.PLU.FindByPLUID(prow.PLUID);
			if (pLURow != null)
			{
				if (PLUImportKeep_Para[0] > 0)
				{
					prow.Name = pLURow.Name;
					prow.ALPHA = pLURow.ALPHA;
					flag = true;
				}
				if (PLUImportKeep_Para[1] > 0)
				{
					prow.Remark = pLURow.Remark;
				}
				if (PLUImportKeep_Para[2] > 0)
				{
					prow.Index = pLURow.Index;
				}
				if (PLUImportKeep_Para[3] > 0)
				{
					prow.ClassID = pLURow.ClassID;
				}
				if (PLUImportKeep_Para[4] > 0)
				{
					prow.UnitID = pLURow.UnitID;
					if (prow.UnitID == 2)
					{
						if ((pLURow.Flag & 1) != 0 && PLUImportKeep_Para[8] > 0)
						{
							prow.Flag = pLURow.Flag;
							prow.Text7 = pLURow.Text7;
						}
					}
					else if ((pLURow.Flag & 2) != 0)
					{
						if (PLUImportKeep_Para[7] > 0)
						{
							prow.Flag = pLURow.Flag;
							prow.Tare = pLURow.Tare;
						}
					}
					else if ((pLURow.Flag & 4) != 0)
					{
						if (PLUImportKeep_Para[6] > 0)
						{
							prow.Flag = pLURow.Flag;
							prow.Flag_Value = pLURow.Flag_Value;
							prow.Tare = pLURow.Tare;
						}
					}
					else if (PLUImportKeep_Para[5] > 0)
					{
						prow.Flag = pLURow.Flag;
						prow.Tare = pLURow.Tare;
					}
				}
				if (PLUImportKeep_Para[9] > 0)
				{
					prow.Price = pLURow.Price;
				}
				if (PLUImportKeep_Para[10] > 0)
				{
					prow.Cost = pLURow.Cost;
				}
				if (PLUImportKeep_Para[11] > 0)
				{
					prow.TaxType = pLURow.TaxType;
					prow.Tax = pLURow.Tax;
				}
				if (PLUImportKeep_Para[12] > 0)
				{
					prow.SspValue1 = pLURow.SspValue1;
				}
				if (PLUImportKeep_Para[13] > 0)
				{
					prow.SspValue2 = pLURow.SspValue2;
				}
				if (PLUImportKeep_Para[14] > 0)
				{
					prow.SspValue3 = pLURow.SspValue3;
				}
				if (PLUImportKeep_Para[15] > 0)
				{
					prow.SspValue4 = pLURow.SspValue4;
				}
				if (PLUImportKeep_Para[16] > 0)
				{
					prow.SType = pLURow.SType;
				}
				if (PLUImportKeep_Para[17] > 0)
				{
					prow.LabelID1 = pLURow.LabelID1;
				}
				if (PLUImportKeep_Para[18] > 0)
				{
					prow.BarT1 = pLURow.BarT1;
					prow.BarF1 = pLURow.BarF1;
				}
				if (PLUImportKeep_Para[19] > 0)
				{
					prow.LabelID2 = pLURow.LabelID2;
				}
				if (PLUImportKeep_Para[20] > 0)
				{
					prow.BarT2 = pLURow.BarT2;
					prow.BarF2 = pLURow.BarF2;
				}
				if (PLUImportKeep_Para[21] > 0)
				{
					prow.Bitmap = pLURow.Bitmap;
				}
				if (PLUImportKeep_Para[22] > 0)
				{
					prow.Text1 = pLURow.Text1;
				}
				if (PLUImportKeep_Para[23] > 0)
				{
					prow.Text2 = pLURow.Text2;
				}
				if (PLUImportKeep_Para[24] > 0)
				{
					prow.Text3 = pLURow.Text3;
				}
				if (PLUImportKeep_Para[25] > 0)
				{
					prow.Text4 = pLURow.Text4;
				}
				if (PLUImportKeep_Para[26] > 0)
				{
					prow.Text5 = pLURow.Text5;
				}
				if (PLUImportKeep_Para[27] > 0)
				{
					prow.Text6 = pLURow.Text6;
				}
				if (PLUImportKeep_Para[28] > 0)
				{
					prow.Text7 = pLURow.Text7;
				}
				if (PLUImportKeep_Para[29] > 0)
				{
					prow.PC_SD = pLURow.PC_SD;
					prow.PS_SD = pLURow.PS_SD;
				}
				if (PLUImportKeep_Para[30] > 0)
				{
					prow.PC_ST = pLURow.PC_ST;
					prow.PS_ST = pLURow.PS_ST;
				}
				if (PLUImportKeep_Para[31] > 0)
				{
					prow.PC_PD = pLURow.PC_PD;
					prow.PS_PD = pLURow.PS_PD;
				}
				if (PLUImportKeep_Para[32] > 0)
				{
					prow.PC_PT = pLURow.PC_PT;
					prow.PS_PT = pLURow.PS_PT;
				}
				if (PLUImportKeep_Para[33] > 0)
				{
					prow.PC_UD = pLURow.PC_UD;
					prow.PS_UD = pLURow.PS_UD;
				}
				if (PLUImportKeep_Para[34] > 0)
				{
					prow.DF_D = pLURow.DF_D;
					prow.DF_U = pLURow.DF_U;
					prow.DF_DN = pLURow.DF_DN;
					prow.DF_UN = pLURow.DF_UN;
				}
				if (PLUImportKeep_Para[35] > 0)
				{
					prow.DA_Sort1 = pLURow.DA_Sort1;
					prow.DA_Day1 = pLURow.DA_Day1;
					prow.DA_Up1 = pLURow.DA_Up1;
					prow.DA_Dn1 = pLURow.DA_Dn1;
					prow.DA_Num1 = pLURow.DA_Num1;
					prow.DA_Sort2 = pLURow.DA_Sort2;
					prow.DA_Day2 = pLURow.DA_Day2;
					prow.DA_Up2 = pLURow.DA_Up2;
					prow.DA_Dn2 = pLURow.DA_Dn2;
					prow.DA_Num2 = pLURow.DA_Num2;
					prow.DA_Sort3 = pLURow.DA_Sort3;
					prow.DA_Day3 = pLURow.DA_Day3;
					prow.DA_Up3 = pLURow.DA_Up3;
					prow.DA_Dn3 = pLURow.DA_Dn3;
					prow.DA_Num3 = pLURow.DA_Num3;
					prow.DA_Sort4 = pLURow.DA_Sort4;
					prow.DA_Day4 = pLURow.DA_Day4;
					prow.DA_Up4 = pLURow.DA_Up4;
					prow.DA_Dn4 = pLURow.DA_Dn4;
					prow.DA_Num4 = pLURow.DA_Num4;
				}
			}
		}
		if (!flag && prow.ALPHA.Length == 0 && Settings.Default.PLUImportAlphaAG)
		{
			prow.ALPHA = Program.GetAlpha(prow.Name);
		}
	}

	public static bool NL_Log_Get(string MAC, string IPP, string[] lines, out string error, out string success, bool LocalCost)
	{
		DateSet_GetNew("PLU");
		string text = ((IPP.Length == 0) ? string.Format(Program.GetLang("pw_cInfo_SingleDevice2"), MAC) : string.Format(Program.GetLang("pw_cInfo_SingleDevice"), MAC, IPP));
		ReportDataSet.DeviceRow deviceRow = reportDataSet.Device.FindByMAC(MAC);
		error = (success = "");
		if (deviceRow == null)
		{
			string text2 = Program.GetLang("pw_ParseError") + ": Device Not Exist, " + text;
			Log_Error(text2);
			error = error + text2 + "\r\n";
			return false;
		}
		uint num = 0u;
		uint num2 = 0u;
		int num3 = 0;
		int num4 = 0;
		while (num4 < lines.Length)
		{
			string text3 = lines[num4];
			num4++;
			string[] array = text3.Split('\t');
			if (array[0] == "REP")
			{
				if (array.Length < 10)
				{
					string text4 = Program.GetLang("pw_ParseError") + ": REP items seg 10/" + text3.Length + ", " + text + ":" + text3;
					Log_Error(text4);
					error = error + text4 + "\r\n";
					return false;
				}
				uint num5 = Program.ParseUint(array[7]);
				if (num2 == 0)
				{
					num = (num2 = num5);
					continue;
				}
				if (num5 < num)
				{
					num = num5;
				}
				if (num5 > num2)
				{
					num2 = num5;
				}
			}
			else if (array[0] == "RES" && array.Length < 18)
			{
				string text5 = Program.GetLang("pw_ParseError") + ": RES items seg 18/" + text3.Length + ", " + text + ":" + text3;
				Log_Error(text5);
				error = error + text5 + "\r\n";
				return false;
			}
		}
		reportDataSet.LogItem.Clear();
		reportDataSet.Log.Clear();
		logTableAdapter.FillPartByMACFID(reportDataSet.Log, MAC, num, num2);
		int num6 = 0;
		while (num6 < lines.Length)
		{
			string text3 = lines[num6];
			num6++;
			string[] array = text3.Split('\t');
			if (array[0] != "REP")
			{
				continue;
			}
			DateTime dateTime = new DateTime(Program.ParseInt(array[1]) + 2000, Program.ParseInt(array[2]), Program.ParseInt(array[3]), Program.ParseInt(array[4]), Program.ParseInt(array[5]), Program.ParseInt(array[6]));
			if (dateTime < History_DT)
			{
				continue;
			}
			ReportDataSet.LogRow logRow = reportDataSet.Log.NewLogRow();
			logRow.MAC = MAC;
			logRow.DateTime = dateTime;
			logRow.FID = Program.ParseInt(array[7]);
			logRow.SID = Program.ParseInt(array[8]);
			logRow.Salesman = Program.ParseInt(array[9]);
			decimal num7 = (logRow.Cost = 0m);
			decimal num9 = (logRow.Tax = num7);
			decimal num11 = (logRow.Payment_Total = num9);
			decimal num13 = (logRow.Payment_Other_3 = num11);
			decimal num15 = (logRow.Payment_Other_2 = num13);
			decimal num17 = (logRow.Payment_Other_1 = num15);
			decimal num19 = (logRow.Payment_Card = num17);
			decimal disRound = (logRow.Sfee = num19);
			logRow.DisRound = disRound;
			decimal num22 = (logRow.Epay7 = 0m);
			decimal num24 = (logRow.Epay6 = num22);
			decimal num26 = (logRow.Epay5 = num24);
			decimal num28 = (logRow.Epay4 = num26);
			decimal num30 = (logRow.Epay3 = num28);
			decimal num32 = (logRow.Epay2 = num30);
			decimal alipay = (logRow.WXpay = num32);
			logRow.Alipay = alipay;
			logRow.SubNo = 0;
			if (logRow.FID == 0)
			{
				string text6 = Program.GetLang("pw_Collision") + ": FID = " + logRow.FID + ", " + text;
				Log_Error(text6);
				error = error + text6 + "\r\n";
				return false;
			}
			if (reportDataSet.Log.FindByMACFID(logRow.MAC, logRow.FID) != null)
			{
				continue;
			}
			if (deviceRow.FIDed == 0)
			{
				deviceRow.FIDed = logRow.FID;
			}
			else if (deviceRow.FIDed < logRow.FID)
			{
				if (deviceRow.FIDed == logRow.FID - 1)
				{
					deviceRow.FIDed = logRow.FID;
				}
				else
				{
					string text7 = ((deviceRow.FIDed + 1 != logRow.FID - 1) ? (Program.GetLang("pw_Lost") + ": FID = " + (deviceRow.FIDed + 1) + " ~ " + (logRow.FID - 1) + ", " + text) : (Program.GetLang("pw_Lost") + ": FID = " + (deviceRow.FIDed + 1) + ", " + text));
					Log_Error(text7);
					error = error + text7 + "\r\n";
					deviceRow.FIDed = logRow.FID;
				}
			}
			reportDataSet.Log.AddLogRow(logRow);
			while (num6 < lines.Length)
			{
				text3 = lines[num6];
				num6++;
				array = text3.Split('\t');
				if (array[0] == "REE")
				{
					break;
				}
				if (array[0] != "RES")
				{
					continue;
				}
				int num35 = Program.ParseInt(array[1]);
				decimal num36 = Program.ParseDecimal(array[2]);
				int num37 = Program.ParseInt(array[3]);
				int num38 = Program.ParseInt(array[9]);
				decimal num39 = Program.ParseDecimal(array[10]);
				if (num35 == 0)
				{
					if (num38 == 0 || num38 == 1 || num38 == 11 || num38 == 10)
					{
						switch (num37)
						{
						case 9999996:
							logRow.DisRound += num36 - num39;
							logRow.Payment_Total += num36;
							logRow.Tax += num39;
							break;
						case 9999997:
							logRow.Sfee += num36;
							logRow.Payment_Total += num36;
							break;
						case 9999995:
							logRow.Payment_Card -= num36;
							break;
						case 9999994:
							logRow.Payment_Other_1 -= num36;
							break;
						case 9999993:
							logRow.Payment_Other_2 -= num36;
							break;
						case 9999992:
							logRow.Payment_Other_3 -= num36;
							break;
						case 9999981:
							logRow.Alipay -= num36;
							break;
						case 9999982:
							logRow.WXpay -= num36;
							break;
						case 9999983:
							logRow.Epay2 -= num36;
							break;
						case 9999984:
							logRow.Epay3 -= num36;
							break;
						case 9999985:
							logRow.Epay4 -= num36;
							break;
						case 9999986:
							logRow.Epay5 -= num36;
							break;
						case 9999987:
							logRow.Epay6 -= num36;
							break;
						case 9999988:
							logRow.Epay7 -= num36;
							break;
						}
					}
					else if (num38 >= 255)
					{
						logRow.SubNo++;
						ReportDataSet.LogItemRow logItemRow = reportDataSet.LogItem.NewLogItemRow();
						logItemRow.MAC = logRow.MAC;
						logItemRow.FID = logRow.FID;
						logItemRow.SubID = num35;
						logItemRow.Price = num36;
						logItemRow.PLU = num37;
						logItemRow.Class = Program.ParseInt(array[4]);
						logItemRow.Dept = Program.ParseInt(array[5]);
						logItemRow.Cost = Program.ParseDecimal(array[6]);
						logItemRow.Amount = Program.ParseDecimal(array[7]);
						logItemRow.Unit = Program.ParseInt(array[8]);
						logItemRow.Type = num38;
						logItemRow.Tax = num39;
						logItemRow.Text1 = Program.ParseString(array[11]);
						logItemRow.Text2 = Program.ParseString(array[12]);
						logItemRow.Text3 = Program.ParseString(array[13]);
						logItemRow.Text4 = Program.ParseString(array[14]);
						logItemRow.UnitPrice = Program.ParseDecimal(array[15]);
						logItemRow.CoFID = Program.ParseInt(array[16]);
						logItemRow.PLUName = Program.ParseString(array[17]);
						logItemRow.DateTime = dateTime;
						reportDataSet.LogItem.AddLogItemRow(logItemRow);
						if (!Stock_Add(logItemRow.Type, deviceRow.GID, logRow.MAC, logRow.FID, logItemRow.SubID, logRow.DateTime, logItemRow.PLU, logItemRow.Unit, logItemRow.Amount, logItemRow.UnitPrice, logItemRow.Price, 0))
						{
							string text8 = Program.GetLang("pw_ParseError") + ": Stock items, " + text;
							Log_Error(text8);
							error = error + text8 + "\r\n";
							return false;
						}
					}
					continue;
				}
				logRow.SubNo++;
				if (logRow.SubNo != num35)
				{
					string text9 = Program.GetLang("pw_ParseError") + ": RES items SubID " + logRow.SubNo + "/" + num35 + ", " + text;
					Log_Error(text9);
					error = error + text9 + "\r\n";
					return false;
				}
				ReportDataSet.LogItemRow logItemRow2 = reportDataSet.LogItem.NewLogItemRow();
				logItemRow2.MAC = logRow.MAC;
				logItemRow2.FID = logRow.FID;
				logItemRow2.SubID = num35;
				logItemRow2.Price = num36;
				logItemRow2.PLU = num37;
				logItemRow2.Class = Program.ParseInt(array[4]);
				logItemRow2.Dept = Program.ParseInt(array[5]);
				logItemRow2.Cost = Program.ParseDecimal(array[6]);
				logItemRow2.Amount = Program.ParseDecimal(array[7]);
				logItemRow2.Unit = Program.ParseInt(array[8]);
				logItemRow2.Type = num38;
				logItemRow2.Tax = num39;
				logItemRow2.Text1 = Program.ParseString(array[11]);
				logItemRow2.Text2 = Program.ParseString(array[12]);
				logItemRow2.Text3 = Program.ParseString(array[13]);
				logItemRow2.Text4 = Program.ParseString(array[14]);
				logItemRow2.UnitPrice = Program.ParseDecimal(array[15]);
				logItemRow2.CoFID = Program.ParseInt(array[16]);
				logItemRow2.PLUName = Program.ParseString(array[17]);
				logItemRow2.DateTime = dateTime;
				if (LocalCost)
				{
					ECSDataSet.PLURow pLURow = eCSDataSet.PLU.FindByPLUID(logItemRow2.PLU);
					if (pLURow != null)
					{
						logItemRow2.Cost = Calculate_TotalPrice(pLURow.Cost, logItemRow2.Amount);
					}
				}
				if (num38 == 0 || num38 == 1 || num38 == 11 || num38 == 10)
				{
					logRow.Payment_Total += num36;
					logRow.Tax += logItemRow2.Tax;
					logRow.Cost += logItemRow2.Cost;
				}
				reportDataSet.LogItem.AddLogItemRow(logItemRow2);
				if (!Stock_Add(logItemRow2.Type, deviceRow.GID, logRow.MAC, logRow.FID, logItemRow2.SubID, logRow.DateTime, logItemRow2.PLU, logItemRow2.Unit, logItemRow2.Amount, logItemRow2.UnitPrice, logItemRow2.Price, 0))
				{
					string text10 = Program.GetLang("pw_ParseError") + ": Stock items, " + text;
					Log_Error(text10);
					error = error + text10 + "\r\n";
					return false;
				}
			}
			num3++;
		}
		string text11 = Program.GetLang("pw_Success") + ": " + num3 + " FID, " + text;
		Log_Info(text11);
		success = success + text11 + "\r\n";
		if (num3 > 0)
		{
			logTableAdapter.Update(reportDataSet.Log);
			logItemTableAdapter.Update(reportDataSet.LogItem);
			Stocked_PClog = false;
			deviceTableAdapter.Update(reportDataSet.Device);
			DataSet_Stock_Reflush();
			DataSet_Update("Report");
		}
		return true;
	}

	public static Exception FK_StockExcel(ReportDataSet.StockExcelItemDataTable sei, int ctGID, int sUnitPrice)
	{
		try
		{
			Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
		}
		catch (ApplicationException result)
		{
			return result;
		}
		Exception ex = null;
		try
		{
			DateSet_GetNew("PLU");
			DateTime now = DateTime.Now;
			bool flag = false;
			reportDataSet.LogItem.Clear();
			reportDataSet.Log.Clear();
			foreach (ReportDataSet.StockExcelItemRow item in sei)
			{
				if (!Stock_Add(item.Type, ctGID, "", 0, 0, now, item.PLU, item.Unit, item.Amount, item.Unit_Price, item.Total_Price, (sUnitPrice == -2) ? 1 : 2, isPC: true))
				{
					Log_Error(Program.GetLang("pw_ParseError") + ": Stock items, PC");
					ex = new ApplicationException(Program.GetLang("pw_ParseError") + ": Stock items, PC");
					break;
				}
				flag = true;
			}
			if (ex == null && flag)
			{
				if (Stocked_PClog)
				{
					logTableAdapter.Update(reportDataSet.Log);
					logItemTableAdapter.Update(reportDataSet.LogItem);
					deviceTableAdapter.Update(reportDataSet.Device);
					Stocked_PClog = false;
				}
				DataSet_Stock_Reflush();
				DataSet_Update("Report");
			}
		}
		catch (Exception ex2)
		{
			ex = ex2;
		}
		finally
		{
			Program.reportLock.ReleaseWriterLock();
		}
		if (ex != null)
		{
			DataSet_Stock_Reject();
		}
		return ex;
	}

	public static Exception FK_StockMultiItem(ReportDataSet.StockMultiItemDataTable smi, int ctGID, bool yes0)
	{
		try
		{
			Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
		}
		catch (ApplicationException result)
		{
			return result;
		}
		Exception ex = null;
		try
		{
			DateSet_GetNew("PLU");
			DateTime now = DateTime.Now;
			bool flag = false;
			reportDataSet.LogItem.Clear();
			reportDataSet.Log.Clear();
			foreach (ReportDataSet.StockMultiItemRow item in smi)
			{
				if (item.Type < 0 || item.Amount <= 0m)
				{
					if (yes0)
					{
						if (!Stock_Add(10, ctGID, "", 0, 0, now, item.PLU, item.Unit, 0m, 0m, 0m, 0))
						{
							Log_Error(Program.GetLang("pw_ParseError") + ": Stock items, PC");
							ex = new ApplicationException(Program.GetLang("pw_ParseError") + ": Stock items, PC");
							break;
						}
						flag = true;
					}
				}
				else
				{
					if (!Stock_Add(item.Type, ctGID, "", 0, 0, now, item.PLU, item.Unit, item.Amount, item.Unit_Price, 0m, 2, isPC: true))
					{
						Log_Error(Program.GetLang("pw_ParseError") + ": Stock items, PC");
						ex = new ApplicationException(Program.GetLang("pw_ParseError") + ": Stock items, PC");
						break;
					}
					flag = true;
				}
			}
			if (ex == null && flag)
			{
				if (Stocked_PClog)
				{
					logTableAdapter.Update(reportDataSet.Log);
					logItemTableAdapter.Update(reportDataSet.LogItem);
					deviceTableAdapter.Update(reportDataSet.Device);
					Stocked_PClog = false;
				}
				DataSet_Stock_Reflush();
				DataSet_Update("Report");
			}
		}
		catch (Exception ex2)
		{
			ex = ex2;
		}
		finally
		{
			Program.reportLock.ReleaseWriterLock();
		}
		if (ex != null)
		{
			DataSet_Stock_Reject();
		}
		return ex;
	}

	public static Exception FK_StockSingle(int SG_GID, int SG_Type, int SG_PLU, int SG_Unit, decimal SG_Amount, decimal SG_UnitPrice)
	{
		try
		{
			Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
		}
		catch (ApplicationException result)
		{
			return result;
		}
		Exception ex = null;
		try
		{
			DateSet_GetNew("PLU");
			DateTime now = DateTime.Now;
			reportDataSet.LogItem.Clear();
			reportDataSet.Log.Clear();
			switch (SG_Type)
			{
			case 12:
			case 13:
			case 14:
				if (!Stock_Add(SG_Type, SG_GID, "", 0, 0, now, SG_PLU, SG_Unit, SG_Amount, 0m, 0m, 0))
				{
					ex = new ApplicationException(Program.GetLang("pw_ParseError") + ": Stock items, PC");
				}
				break;
			case 0:
			case 1:
			case 10:
			case 11:
				if (!Stock_Add(SG_Type, SG_GID, "", 0, 0, now, SG_PLU, SG_Unit, SG_Amount, SG_UnitPrice, 0m, 2, isPC: true))
				{
					ex = new ApplicationException(Program.GetLang("pw_ParseError") + ": Stock items, PC");
				}
				break;
			}
			if (ex == null)
			{
				if (Stocked_PClog)
				{
					logTableAdapter.Update(reportDataSet.Log);
					logItemTableAdapter.Update(reportDataSet.LogItem);
					deviceTableAdapter.Update(reportDataSet.Device);
					Stocked_PClog = false;
				}
				DataSet_Stock_Reflush();
				DataSet_Update("Report");
			}
		}
		catch (Exception ex2)
		{
			ex = ex2;
		}
		finally
		{
			Program.reportLock.ReleaseWriterLock();
		}
		return ex;
	}

	public static ApplicationException FK_Stock_ClearSP(int ctGID)
	{
		try
		{
			Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
		}
		catch (ApplicationException result)
		{
			return result;
		}
		try
		{
			ReportDataSet.SGroupRow sGroupRow = reportDataSet.SGroup.FindByGID(ctGID);
			ReportDataSet.StockRow[] stockRows = sGroupRow.GetStockRows();
			foreach (ReportDataSet.StockRow stockRow in stockRows)
			{
				int num = (stockRow.UnitSP = 0);
				decimal num3 = (stockRow.SpoilageSP = num);
				decimal amountSP = (stockRow.In_AmountSP = num3);
				stockRow.AmountSP = amountSP;
				stockRow.Sped = false;
			}
			stockTableAdapter.Update(reportDataSet.Stock);
			DataSet_Update("Report");
		}
		catch
		{
		}
		finally
		{
			Program.reportLock.ReleaseWriterLock();
		}
		return null;
	}

	public static ApplicationException FK_Stock_ClearIn(int ctGID)
	{
		try
		{
			Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
		}
		catch (ApplicationException result)
		{
			return result;
		}
		try
		{
			ReportDataSet.SGroupRow sGroupRow = reportDataSet.SGroup.FindByGID(ctGID);
			ReportDataSet.StockRow[] stockRows = sGroupRow.GetStockRows();
			foreach (ReportDataSet.StockRow stockRow in stockRows)
			{
				decimal num = (stockRow.In_Money = 0m);
				decimal in_Amount = (stockRow.In_AmountSP = num);
				stockRow.In_Amount = in_Amount;
			}
			stockTableAdapter.Update(reportDataSet.Stock);
			DataSet_Update("Report");
		}
		catch
		{
		}
		finally
		{
			Program.reportLock.ReleaseWriterLock();
		}
		return null;
	}

	public static ApplicationException FK_Stock_ClearOrder(int ctGID)
	{
		try
		{
			Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
		}
		catch (ApplicationException result)
		{
			return result;
		}
		try
		{
			ReportDataSet.SGroupRow sGroupRow = reportDataSet.SGroup.FindByGID(ctGID);
			ReportDataSet.StockRow[] stockRows = sGroupRow.GetStockRows();
			foreach (ReportDataSet.StockRow stockRow in stockRows)
			{
				stockRow.Order = 0m;
			}
			stockTableAdapter.Update(reportDataSet.Stock);
			DataSet_Update("Report");
		}
		catch
		{
		}
		finally
		{
			Program.reportLock.ReleaseWriterLock();
		}
		return null;
	}

	public static ApplicationException FK_Stock_ClearSpoilage(int ctGID)
	{
		try
		{
			Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
		}
		catch (ApplicationException result)
		{
			return result;
		}
		try
		{
			ReportDataSet.SGroupRow sGroupRow = reportDataSet.SGroup.FindByGID(ctGID);
			ReportDataSet.StockRow[] stockRows = sGroupRow.GetStockRows();
			foreach (ReportDataSet.StockRow stockRow in stockRows)
			{
				decimal spoilage = (stockRow.SpoilageSP = 0m);
				stockRow.Spoilage = spoilage;
			}
			stockTableAdapter.Update(reportDataSet.Stock);
			DataSet_Update("Report");
		}
		catch
		{
		}
		finally
		{
			Program.reportLock.ReleaseWriterLock();
		}
		return null;
	}

	public static bool FK_Stock_NewSafetyStock(int ctGID, int PLU, decimal SavetyStock)
	{
		try
		{
			Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
		}
		catch (ApplicationException)
		{
			return false;
		}
		bool result = false;
		try
		{
			DateSet_GetNew("PLU");
			ReportDataSet.StockRow stockRow = reportDataSet.Stock.FindByGIDPLU(ctGID, PLU);
			if (stockRow != null)
			{
				stockRow.SafetyStock = SavetyStock;
				stockTableAdapter.Update(reportDataSet.Stock);
				return true;
			}
		}
		catch
		{
		}
		finally
		{
			Program.reportLock.ReleaseWriterLock();
		}
		return result;
	}
}
