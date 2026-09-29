using System;
using System.IO;
using System.Text;
using System.Windows.Forms;
using ECS.Properties;

namespace ECS;

public class Common
{
	private static int ConvertInt32_ErrorTo(string Dstring, int Dint)
	{
		try
		{
			return Convert.ToInt32(Dstring);
		}
		catch (Exception)
		{
			return Dint;
		}
	}

	private static int ConvertInt32_ErrorToZero(string Dstring)
	{
		return ConvertInt32_ErrorTo(Dstring, 0);
	}

	private static bool ConvertInt32_Error(string Dstring, out int Dout)
	{
		bool result = false;
		try
		{
			Dout = Convert.ToInt32(Dstring);
		}
		catch (Exception)
		{
			Dout = 0;
			result = true;
		}
		return result;
	}

	private static bool ConvertDecimal_Error(string Dstring, out decimal Dout)
	{
		bool result = false;
		try
		{
			Dout = Convert.ToDecimal(Dstring);
		}
		catch (Exception)
		{
			Dout = 0m;
			result = true;
		}
		return result;
	}

	private static decimal ConvertDecimal_ErrorTo(string Dstring, decimal Ddec)
	{
		try
		{
			return Convert.ToDecimal(Dstring);
		}
		catch (Exception)
		{
			return Ddec;
		}
	}

	private static decimal ConvertDecimal_ErrorToZero(string Dstring)
	{
		return ConvertDecimal_ErrorTo(Dstring, 0m);
	}

	private static int SaveToFile_Part(ref string Data, ref string bufferS, ref decimal bufferNum, ref string Line, int RowNo)
	{
		string text = "0000000000000000000";
		if (Data.Length == 0)
		{
			return 1;
		}
		char c = Data.ToCharArray(0, 1)[0];
		Data = Data.Substring(1);
		switch (c)
		{
		case '@':
			return 0;
		case 'Z':
		case 'z':
			if (Data == "{RowNo")
			{
				bufferS = null;
				bufferNum = RowNo + 1;
			}
			else if (Data == "{RowCount")
			{
				bufferS = null;
				bufferNum = RowNo;
			}
			else
			{
				if (c != 'Z')
				{
					break;
				}
				if (Data == "}RowNo")
				{
					if (bufferS != null && ConvertDecimal_Error(bufferS, out bufferNum))
					{
						return 2;
					}
					if (bufferNum != (decimal)(RowNo + 1))
					{
						return 2;
					}
				}
				else if (Data == "}RowCount")
				{
					if (bufferS != null && ConvertDecimal_Error(bufferS, out bufferNum))
					{
						return 2;
					}
					if (bufferNum != (decimal)RowNo)
					{
						return 2;
					}
				}
			}
			break;
		case 'S':
		{
			string text2 = ((Data.Length != 0) ? Data.Replace("\\x23", "#").Replace("\\\\", "\\") : "\t");
			if (bufferS == null)
			{
				bufferS = bufferNum.ToString();
			}
			Line = bufferS + text2 + Line;
			break;
		}
		case 'L':
		case 'l':
		{
			if (ConvertInt32_Error(Data, out var Dout6))
			{
				return 2;
			}
			if (bufferS == null)
			{
				bufferS = bufferNum.ToString(text.Substring(0, Dout6));
			}
			else
			{
				while (bufferS.Length < Dout6)
				{
					bufferS = ' ' + bufferS;
				}
			}
			if (c == 'L' && Dout6 != 0 && bufferS.Length > Dout6)
			{
				bufferS = bufferS.Substring(bufferS.Length - Dout6);
			}
			Line = bufferS + Line;
			break;
		}
		case 'C':
		case 'c':
			if (c != 'C')
			{
				break;
			}
			if (bufferS == null)
			{
				if (ConvertDecimal_Error(Data, out var Dout8))
				{
					return 2;
				}
				if (Dout8 != bufferNum)
				{
					return 2;
				}
			}
			else if (bufferS != Data)
			{
				return 2;
			}
			break;
		case 'D':
		case 'd':
			bufferS = Data;
			break;
		case '*':
		{
			if (ConvertDecimal_Error(Data, out var Dout2))
			{
				return 2;
			}
			bufferNum /= Dout2;
			break;
		}
		case '/':
		{
			if (ConvertDecimal_Error(Data, out var Dout3))
			{
				return 2;
			}
			bufferNum *= Dout3;
			break;
		}
		case '+':
		{
			if (ConvertDecimal_Error(Data, out var Dout))
			{
				return 2;
			}
			bufferNum -= Dout;
			break;
		}
		case '-':
		{
			if (ConvertDecimal_Error(Data, out var Dout7))
			{
				return 2;
			}
			bufferNum += Dout7;
			break;
		}
		case 'F':
		case 'f':
		{
			string[] array2 = Data.Split('.');
			int Dout4 = 0;
			int Dout5 = 0;
			if (array2.Length >= 1 && ConvertInt32_Error(array2[0], out Dout4))
			{
				return 2;
			}
			if (array2.Length >= 2 && ConvertInt32_Error(array2[1], out Dout5))
			{
				return 2;
			}
			if (Dout4 <= 0)
			{
				Dout4 = 1;
			}
			string text3 = text.Substring(0, Dout4);
			if (Dout5 >= 1)
			{
				text3 = text3 + '.' + text.Substring(0, Dout5);
			}
			bufferS = bufferNum.ToString(text3);
			break;
		}
		case 'T':
		{
			string[] array = Data.Split('|');
			if (array.Length % 2 != 0)
			{
				return 2;
			}
			if (bufferS == null)
			{
				bufferS = bufferNum.ToString();
			}
			int num = 0;
			while (true)
			{
				if (num == array.Length - 2)
				{
					bufferS = array[num];
					break;
				}
				if (bufferS == array[num + 1])
				{
					bufferS = array[num];
					break;
				}
				num += 2;
			}
			break;
		}
		}
		return 1;
	}

	private static int OpenFromFile_Part(ref string Data, ref string bufferS, ref decimal bufferNum, ref string Line, int RowNo)
	{
		if (Data.Length == 0)
		{
			return 1;
		}
		char c = Data.ToCharArray(0, 1)[0];
		Data = Data.Substring(1);
		switch (c)
		{
		case '@':
			return 0;
		case 'Z':
		case 'z':
			if (Data == "}RowNo")
			{
				bufferS = null;
				bufferNum = RowNo + 1;
			}
			else if (Data == "}RowCount")
			{
				bufferS = null;
				bufferNum = RowNo;
			}
			else
			{
				if (c != 'Z')
				{
					break;
				}
				if (Data == "{RowNo")
				{
					if (bufferS != null && ConvertDecimal_Error(bufferS, out bufferNum))
					{
						return 2;
					}
					if (bufferNum != (decimal)(RowNo + 1))
					{
						return 2;
					}
				}
				else if (Data == "{RowCount")
				{
					if (bufferS != null && ConvertDecimal_Error(bufferS, out bufferNum))
					{
						return 2;
					}
					if (bufferNum != (decimal)RowNo)
					{
						return 2;
					}
				}
			}
			break;
		case 'S':
		{
			string text = ((Data.Length != 0) ? Data.Replace("\\x23", "#").Replace("\\\\", "\\") : "\t");
			int num2 = Line.IndexOf(text);
			if (num2 == -1)
			{
				bufferS = Line;
				Line = "";
			}
			else
			{
				bufferS = Line.Substring(0, num2);
				Line = Line.Substring(num2 + text.Length);
			}
			break;
		}
		case 's':
		{
			string text2 = ((Data.Length != 0) ? Data.Replace("\\x23", "#").Replace("\\\\", "\\") : "\t");
			while (true)
			{
				string text3 = Line.Substring(0, text2.Length);
				if (text3 != text2)
				{
					break;
				}
				Line = Line.Substring(text2.Length);
			}
			break;
		}
		case 'L':
		case 'l':
		{
			if (ConvertInt32_Error(Data, out var Dout8))
			{
				return 2;
			}
			if (Dout8 == 0 || Dout8 >= Line.Length)
			{
				bufferS = Line;
				Line = "";
			}
			else
			{
				bufferS = Line.Substring(0, Dout8);
				Line = Line.Substring(Dout8);
			}
			break;
		}
		case 'C':
		case 'c':
			bufferS = Data;
			break;
		case 'D':
		case 'd':
			if (c != 'D')
			{
				break;
			}
			if (bufferS == null)
			{
				if (ConvertDecimal_Error(Data, out var Dout2))
				{
					return 2;
				}
				if (Dout2 != bufferNum)
				{
					return 2;
				}
			}
			else if (bufferS != Data)
			{
				return 2;
			}
			break;
		case 'e':
			bufferS = bufferS.TrimStart();
			break;
		case 'E':
			bufferS = bufferS.TrimEnd();
			break;
		case '*':
		{
			if (ConvertDecimal_Error(Data, out var Dout7))
			{
				return 2;
			}
			if (bufferS != null)
			{
				if (ConvertDecimal_Error(bufferS, out bufferNum))
				{
					return 2;
				}
				bufferS = null;
			}
			bufferNum *= Dout7;
			break;
		}
		case '/':
		{
			if (ConvertDecimal_Error(Data, out var Dout))
			{
				return 2;
			}
			if (bufferS != null)
			{
				if (ConvertDecimal_Error(bufferS, out bufferNum))
				{
					return 2;
				}
				bufferS = null;
			}
			bufferNum /= Dout;
			break;
		}
		case '+':
		{
			if (ConvertDecimal_Error(Data, out var Dout3))
			{
				return 2;
			}
			if (bufferS != null)
			{
				if (ConvertDecimal_Error(bufferS, out bufferNum))
				{
					return 2;
				}
				bufferS = null;
			}
			bufferNum += Dout3;
			break;
		}
		case '-':
		{
			if (ConvertDecimal_Error(Data, out var Dout6))
			{
				return 2;
			}
			if (bufferS != null)
			{
				if (ConvertDecimal_Error(bufferS, out bufferNum))
				{
					return 2;
				}
				bufferS = null;
			}
			bufferNum -= Dout6;
			break;
		}
		case 'M':
			if (bufferS != null)
			{
				bufferS = bufferS.Trim();
			}
			break;
		case 'F':
		case 'f':
			if (bufferS != null)
			{
				if (ConvertDecimal_Error(bufferS, out bufferNum))
				{
					return 2;
				}
				bufferS = null;
			}
			break;
		case 'P':
		case 'p':
		{
			string[] array2 = Data.Split('.');
			int Dout4 = 0;
			int Dout5 = 0;
			if (array2.Length >= 1 && ConvertInt32_Error(array2[0], out Dout4))
			{
				return 2;
			}
			if (array2.Length >= 2 && ConvertInt32_Error(array2[1], out Dout5))
			{
				return 2;
			}
			if (bufferS == null)
			{
				break;
			}
			if (Dout4 >= 0)
			{
				if (Dout5 == 0)
				{
					bufferS = bufferS.Substring(Dout4);
				}
				else
				{
					bufferS = bufferS.Substring(Dout4, Dout5);
				}
				break;
			}
			Dout4 = -(Dout4 + 1);
			if (Dout4 >= bufferS.Length)
			{
				bufferS = "";
				break;
			}
			bufferS = bufferS.Substring(0, bufferS.Length - Dout4);
			if (Dout5 > bufferS.Length)
			{
				Dout5 = bufferS.Length;
			}
			bufferS = bufferS.Substring(bufferS.Length - Dout5, Dout5);
			break;
		}
		case 'T':
		{
			string[] array = Data.Split('|');
			if (array.Length % 2 != 0)
			{
				return 2;
			}
			if (bufferS == null)
			{
				bufferS = bufferNum.ToString();
			}
			int num = 0;
			while (true)
			{
				if (num == array.Length - 2)
				{
					bufferS = array[num + 1];
					break;
				}
				if (bufferS == array[num])
				{
					bufferS = array[num + 1];
					break;
				}
				num += 2;
			}
			break;
		}
		}
		return 1;
	}

	public static Exception ArithmeticFile_Read(ref ECSDataSet eSet, string fileName, string formattype)
	{
		Exception result = null;
		eSet.Clear();
		try
		{
			Cursor.Current = Cursors.WaitCursor;
			string text = Settings.Default.configEncoding;
			string[] array = null;
			string[] array2 = formattype.Split('\r', '\n');
			for (int i = 0; i < array2.Length; i++)
			{
				if (array2[i].Length == 0)
				{
					continue;
				}
				string[] array3 = array2[i].Split('#');
				if (array3[0].Length < 5)
				{
					continue;
				}
				if (array3[0].Substring(0, 5) == "CODE_")
				{
					if (text != array3[0].Substring(5))
					{
						text = array3[0].Substring(5);
						array = null;
					}
				}
				else
				{
					if (!(array3[0].Substring(0, 5) == "FILE_"))
					{
						continue;
					}
					if (array == null)
					{
						array = File.ReadAllLines(fileName, Encoding.GetEncoding(text));
					}
					string text2 = array3[0].Substring(5);
					if (text2 == "PLU")
					{
						int num;
						for (int j = (num = 0); j < array.Length; j++)
						{
							string bufferS = null;
							decimal bufferNum = 0m;
							string Line = array[j];
							if (Line.Length == 0)
							{
								continue;
							}
							ECSDataSet.PLURow pLURow = eSet.PLU.NewPLURow();
							int num2 = 1;
							while (true)
							{
								if (num2 >= array3.Length)
								{
									if (eSet.PLU.FindByPLUID(pLURow.PLUID) == null && pLURow.PLUID >= Settings.Default.minUserPLUID && (decimal)pLURow.PLUID <= Settings.Default.maxPLUID)
									{
										RDS.NL_PLUImportKeep(pLURow);
										eSet.PLU.AddPLURow(pLURow);
										num++;
									}
									break;
								}
								string Data = array3[num2];
								switch (OpenFromFile_Part(ref Data, ref bufferS, ref bufferNum, ref Line, num))
								{
								case 0:
									switch (Data)
									{
									default:
										if (bufferS != null && ConvertDecimal_Error(bufferS, out bufferNum))
										{
											break;
										}
										goto case "Index";
									case "Index":
									case "Name":
									case "Text1":
									case "Text2":
									case "Text3":
									case "Text4":
									case "Text5":
									case "Text6":
									case "Text7":
									{
										decimal num3 = bufferNum;
										int pLUID;
										try
										{
											pLUID = Convert.ToInt32(num3);
										}
										catch (Exception)
										{
											pLUID = 0;
										}
										switch (Data)
										{
										case "Number":
											pLURow.PLUID = pLUID;
											break;
										case "ItemCode":
											pLURow.Remark = (int)num3;
											break;
										case "Index":
											pLURow.Index = bufferS;
											break;
										case "Unit":
											pLURow.UnitID = (int)num3;
											break;
										case "Price":
											pLURow.Price = num3;
											break;
										case "Cost":
											pLURow.Cost = num3;
											break;
										case "Tare":
											pLURow.Tare = num3;
											break;
										case "B1_Print":
											pLURow.LabelID1 = (int)num3;
											break;
										case "B1_Bar":
											pLURow.BarT1 = (int)num3;
											break;
										case "B1_BarFlag":
											pLURow.BarF1 = (int)num3;
											break;
										case "B2_Print":
											pLURow.LabelID2 = (int)num3;
											break;
										case "B2_Bar":
											pLURow.BarT2 = (int)num3;
											break;
										case "B2_BarFlag":
											pLURow.BarF2 = (int)num3;
											break;
										case "Class":
											pLURow.ClassID = (int)num3;
											break;
										case "Name":
											pLURow.Name = bufferS;
											break;
										case "Text1":
											pLURow.Text1 = bufferS;
											break;
										case "Text2":
											pLURow.Text2 = bufferS;
											break;
										case "Text3":
											pLURow.Text3 = bufferS;
											break;
										case "Text4":
											pLURow.Text4 = bufferS;
											break;
										case "Text5":
											pLURow.Text5 = bufferS;
											break;
										case "Text6":
											pLURow.Text6 = bufferS;
											break;
										case "Text7":
											pLURow.Text7 = bufferS;
											break;
										case "ALPHA":
											pLURow.ALPHA = bufferS;
											break;
										case "TaxType":
											pLURow.TaxType = (int)num3;
											break;
										case "TaxRate":
											pLURow.Tax = (int)num3;
											break;
										case "SspValue1":
											pLURow.SspValue1 = (int)num3;
											break;
										case "SspValue2":
											pLURow.SspValue2 = (int)num3;
											break;
										case "SspValue3":
											pLURow.SspValue3 = (int)num3;
											break;
										case "SspValue4":
											pLURow.SspValue4 = (int)num3;
											break;
										case "SType":
											pLURow.SType = (int)num3;
											break;
										case "Flag":
											pLURow.Flag = (int)num3;
											break;
										case "Flag_Value":
											pLURow.Flag_Value = (int)num3;
											break;
										case "Bitmap":
											pLURow.Bitmap = (int)num3;
											break;
										case "PS_SaleDate":
											pLURow.PS_SD = (int)num3;
											break;
										case "PS_SaleTime":
											pLURow.PS_ST = (int)num3;
											break;
										case "PS_PackDate":
											pLURow.PS_PD = (int)num3;
											break;
										case "PS_PackTime":
											pLURow.PS_PT = (int)num3;
											break;
										case "PS_ShelfDate":
											pLURow.PS_UD = (int)num3;
											break;
										case "PC_SaleDate":
											pLURow.PC_SD = (int)num3;
											break;
										case "PC_SaleTime":
											pLURow.PC_ST = (int)num3;
											break;
										case "PC_PackDate":
											pLURow.PC_PD = (int)num3;
											break;
										case "PC_PackTime":
											pLURow.PC_PT = (int)num3;
											break;
										case "PC_ShelfDate":
											pLURow.PC_UD = (int)num3;
											break;
										case "DF_LowerSort":
											pLURow.DF_D = (int)num3;
											break;
										case "DF_UpperSort":
											pLURow.DF_U = (int)num3;
											break;
										case "DF_LowerNumber":
											pLURow.DF_DN = num3;
											break;
										case "DF_UpperNumber":
											pLURow.DF_UN = num3;
											break;
										case "DA1_Sort":
											pLURow.DA_Sort1 = (int)num3;
											break;
										case "DA1_Day":
											pLURow.DA_Day1 = (int)num3;
											break;
										case "DA1_LowerLimit":
											pLURow.DA_Dn1 = num3;
											break;
										case "DA1_UpperLimit":
											pLURow.DA_Up1 = num3;
											break;
										case "DA1_Number":
											pLURow.DA_Num1 = num3;
											break;
										case "DA2_Sort":
											pLURow.DA_Sort2 = (int)num3;
											break;
										case "DA2_Day":
											pLURow.DA_Day2 = (int)num3;
											break;
										case "DA2_LowerLimit":
											pLURow.DA_Dn2 = num3;
											break;
										case "DA2_UpperLimit":
											pLURow.DA_Up2 = num3;
											break;
										case "DA2_Number":
											pLURow.DA_Num2 = num3;
											break;
										case "DA3_Sort":
											pLURow.DA_Sort3 = (int)num3;
											break;
										case "DA3_Day":
											pLURow.DA_Day3 = (int)num3;
											break;
										case "DA3_LowerLimit":
											pLURow.DA_Dn3 = num3;
											break;
										case "DA3_UpperLimit":
											pLURow.DA_Up3 = num3;
											break;
										case "DA3_Number":
											pLURow.DA_Num3 = num3;
											break;
										case "DA4_Sort":
											pLURow.DA_Sort4 = (int)num3;
											break;
										case "DA4_Day":
											pLURow.DA_Day4 = (int)num3;
											break;
										case "DA4_LowerLimit":
											pLURow.DA_Dn4 = num3;
											break;
										case "DA4_UpperLimit":
											pLURow.DA_Up4 = num3;
											break;
										case "DA4_Number":
											pLURow.DA_Num4 = num3;
											break;
										}
										goto IL_0a86;
									}
									}
									break;
								default:
									goto IL_0a86;
								case 2:
									break;
								}
								break;
								IL_0a86:
								num2++;
							}
						}
					}
					else
					{
						_ = text2 == "Class";
					}
				}
			}
		}
		catch (Exception ex2)
		{
			result = ex2;
		}
		finally
		{
			Cursor.Current = Cursors.Default;
		}
		return result;
	}

	public static Exception ArithmeticFile_Write(ref ECSDataSet eSet, string fileName, string formattype)
	{
		Exception result = null;
		string text = Application.StartupPath + "\\Tm-xA.tmp";
		try
		{
			Cursor.Current = Cursors.WaitCursor;
			string directoryName = Path.GetDirectoryName(fileName);
			if (!Directory.Exists(directoryName))
			{
				Directory.CreateDirectory(directoryName);
			}
			using (StreamWriter streamWriter = new StreamWriter(text, append: false, Program.GetEncoding()))
			{
				string[] array = formattype.Split('\r', '\n');
				for (int i = 0; i < array.Length; i++)
				{
					if (array[i].Length == 0)
					{
						continue;
					}
					string[] array2 = array[i].Split('#');
					if (!(array2[0].Substring(0, 5) == "FILE_"))
					{
						continue;
					}
					string text2 = array2[0].Substring(5);
					if (text2 == "PLU")
					{
						int num = 0;
						foreach (ECSDataSet.PLURow item in eSet.PLU)
						{
							string bufferS = null;
							decimal bufferNum = 0m;
							string Line = "";
							int num2 = array2.Length - 1;
							while (true)
							{
								if (num2 <= 0)
								{
									streamWriter.WriteLine(Line);
									break;
								}
								string Data = array2[num2];
								switch (SaveToFile_Part(ref Data, ref bufferS, ref bufferNum, ref Line, num))
								{
								case 0:
									bufferS = null;
									bufferNum = 0m;
									switch (Data)
									{
									case "Number":
										bufferNum = item.PLUID;
										break;
									case "ItemCode":
										bufferNum = item.Remark;
										break;
									case "Index":
										bufferS = item.Index;
										break;
									case "Unit":
										bufferNum = item.UnitID;
										break;
									case "Price":
										bufferNum = item.Price;
										break;
									case "Cost":
										bufferNum = item.Cost;
										break;
									case "Tare":
										bufferNum = item.Tare;
										break;
									case "B1_Print":
										bufferNum = item.LabelID1;
										break;
									case "B1_Bar":
										bufferNum = item.BarT1;
										break;
									case "B1_BarFlag":
										bufferNum = item.BarF1;
										break;
									case "B2_Print":
										bufferNum = item.LabelID2;
										break;
									case "B2_Bar":
										bufferNum = item.BarT2;
										break;
									case "B2_BarFlag":
										bufferNum = item.BarF2;
										break;
									case "Class":
										bufferNum = item.ClassID;
										break;
									case "Name":
										bufferS = item.Name;
										break;
									case "Text1":
										bufferS = item.Text1;
										break;
									case "Text2":
										bufferS = item.Text2;
										break;
									case "Text3":
										bufferS = item.Text3;
										break;
									case "Text4":
										bufferS = item.Text4;
										break;
									case "Text5":
										bufferS = item.Text5;
										break;
									case "Text6":
										bufferS = item.Text6;
										break;
									case "Text7":
										bufferS = item.Text7;
										break;
									case "ALPHA":
										bufferS = item.ALPHA;
										break;
									case "TaxType":
										bufferNum = item.TaxType;
										break;
									case "TaxRate":
										bufferNum = item.Tax;
										break;
									case "SspValue1":
										bufferNum = item.SspValue1;
										break;
									case "SspValue2":
										bufferNum = item.SspValue2;
										break;
									case "SspValue3":
										bufferNum = item.SspValue3;
										break;
									case "SspValue4":
										bufferNum = item.SspValue4;
										break;
									case "SType":
										bufferNum = item.SType;
										break;
									case "Flag":
										bufferNum = item.Flag;
										break;
									case "Flag_Value":
										bufferNum = item.Flag_Value;
										break;
									case "Bitmap":
										bufferNum = item.Bitmap;
										break;
									case "PS_SaleDate":
										bufferNum = item.PS_SD;
										break;
									case "PS_SaleTime":
										bufferNum = item.PS_ST;
										break;
									case "PS_PackDate":
										bufferNum = item.PS_PD;
										break;
									case "PS_PackTime":
										bufferNum = item.PS_PT;
										break;
									case "PS_ShelfDate":
										bufferNum = item.PS_UD;
										break;
									case "PC_SaleDate":
										bufferNum = item.PC_SD;
										break;
									case "PC_SaleTime":
										bufferNum = item.PC_ST;
										break;
									case "PC_PackDate":
										bufferNum = item.PC_PD;
										break;
									case "PC_PackTime":
										bufferNum = item.PC_PT;
										break;
									case "PC_ShelfDate":
										bufferNum = item.PC_UD;
										break;
									case "DF_LowerSort":
										bufferNum = item.DF_D;
										break;
									case "DF_UpperSort":
										bufferNum = item.DF_U;
										break;
									case "DF_LowerNumber":
										bufferNum = item.DF_DN;
										break;
									case "DF_UpperNumber":
										bufferNum = item.DF_UN;
										break;
									case "DA1_Sort":
										bufferNum = item.DA_Sort1;
										break;
									case "DA1_Day":
										bufferNum = item.DA_Day1;
										break;
									case "DA1_LowerLimit":
										bufferNum = item.DA_Dn1;
										break;
									case "DA1_UpperLimit":
										bufferNum = item.DA_Up1;
										break;
									case "DA1_Number":
										bufferNum = item.DA_Num1;
										break;
									case "DA2_Sort":
										bufferNum = item.DA_Sort2;
										break;
									case "DA2_Day":
										bufferNum = item.DA_Day2;
										break;
									case "DA2_LowerLimit":
										bufferNum = item.DA_Dn2;
										break;
									case "DA2_UpperLimit":
										bufferNum = item.DA_Up2;
										break;
									case "DA2_Number":
										bufferNum = item.DA_Num2;
										break;
									case "DA3_Sort":
										bufferNum = item.DA_Sort3;
										break;
									case "DA3_Day":
										bufferNum = item.DA_Day3;
										break;
									case "DA3_LowerLimit":
										bufferNum = item.DA_Dn3;
										break;
									case "DA3_UpperLimit":
										bufferNum = item.DA_Up3;
										break;
									case "DA3_Number":
										bufferNum = item.DA_Num3;
										break;
									case "DA4_Sort":
										bufferNum = item.DA_Sort4;
										break;
									case "DA4_Day":
										bufferNum = item.DA_Day4;
										break;
									case "DA4_LowerLimit":
										bufferNum = item.DA_Dn4;
										break;
									case "DA4_UpperLimit":
										bufferNum = item.DA_Up4;
										break;
									case "DA4_Number":
										bufferNum = item.DA_Num4;
										break;
									}
									goto IL_0954;
								default:
									goto IL_0954;
								case 2:
									break;
								}
								break;
								IL_0954:
								num2--;
							}
							num++;
						}
					}
					else
					{
						_ = text2 == "Class";
					}
				}
			}
			File.Copy(text, fileName, overwrite: true);
		}
		catch (Exception ex)
		{
			result = ex;
		}
		finally
		{
			File.Delete(text);
			Cursor.Current = Cursors.Default;
		}
		return result;
	}
}
