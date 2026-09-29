using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Configuration;
using System.Data.OleDb;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;
using ECS.Properties;
using ECS.ReportDataSetTableAdapters;
using JRO;
using Microsoft.International.Converters.PinYinConverter;

namespace ECS;

internal static class Program
{
	public enum Right
	{
		User,
		Admin,
		SuperAdmin
	}

	private class ChineseFC
	{
		public char fpy;

		public int ct;
	}

	public enum DecimalFormat
	{
		None,
		Price,
		Weight
	}

	private struct LASTINPUTINFO
	{
		[MarshalAs(UnmanagedType.U4)]
		public int cbSize;

		[MarshalAs(UnmanagedType.U4)]
		public uint dwTime;
	}

	private const int SW_HIDE = 0;

	private const int SW_SHOWNORMAL = 1;

	private const int SW_SHOWMINIMIZED = 2;

	private const int SW_SHOWMAXIMIZED = 3;

	private const int SW_SHOWNOACTIVATE = 4;

	private const int SW_RESTORE = 9;

	private const int SW_SHOWDEFAULT = 10;

	public static MainForm mf;

	public static string sWizard = "";

	public static int VALIDCHECK_Wizard = 15;

	public static int VALIDCHECK_Database = 11;

	public static ReaderWriterLock ecsLock = new ReaderWriterLock();

	public static ReaderWriterLock reportLock = new ReaderWriterLock();

	public static Right right = Right.User;

	public static byte[] SecurityCode = Encoding.UTF8.GetBytes("TM-xA Report Backup SecurityCode");

	public static UIDataSet ForLang = new UIDataSet();

	public static List<string> LangSocket = new List<string>();

	private static readonly uint GW_HWNDNEXT = 2u;

	public static bool NoAskDirty = false;

	public static ReaderWriterLock GetRWLock(string file)
	{
		if (file == "ECS.mdb")
		{
			return ecsLock;
		}
		if (file == "Report.mdb")
		{
			return reportLock;
		}
		return null;
	}

	public static Encoding GetEncoding()
	{
		return Encoding.GetEncoding(Settings.Default.configEncoding);
	}

	public static string GetZeroString(int Zero)
	{
		if (Zero <= 0)
		{
			return "G";
		}
		string text = "";
		while (Zero != 0)
		{
			text += "0";
			Zero--;
		}
		return text;
	}

	public static void getByte(byte b, ref string st)
	{
		st += (char)(64 + b / 16);
		st += (char)(64 + b % 16);
	}

	public static void getByte_multi(uint u32, ref string st, int mt)
	{
		while (mt > 0)
		{
			getByte((byte)u32, ref st);
			u32 >>= 8;
			mt--;
		}
	}

	public static void TextSizeChange(TextBox tb, Keys kc)
	{
		if (tb == null)
		{
			return;
		}
		switch (kc)
		{
		case Keys.Up:
			tb.Font = new Font(tb.Font.FontFamily, tb.Font.Size + 1f, tb.Font.Style);
			break;
		case Keys.Down:
			if (tb.Font.Size > 5f)
			{
				tb.Font = new Font(tb.Font.FontFamily, tb.Font.Size - 1f, tb.Font.Style);
			}
			break;
		}
	}

	public static bool NumberOnly(string st)
	{
		string pattern = "^\\d+$";
		Regex regex = new Regex(pattern);
		return regex.IsMatch(st);
	}

	public static int ParseInt(string item)
	{
		return ParseInt(item, 0);
	}

	public static uint ParseUint(string item)
	{
		return ParseUint(item, 0u);
	}

	public static int ParseInt(string item, int def)
	{
		if (!int.TryParse(item, out var result))
		{
			return def;
		}
		return result;
	}

	public static uint ParseUint(string item, uint def)
	{
		if (!uint.TryParse(item, out var result))
		{
			return def;
		}
		return result;
	}

	public static bool ParseBool(string item)
	{
		if (item.ToLower() == "false")
		{
			return false;
		}
		return true;
	}

	public static DateTime ParseDateTime(string item)
	{
		return DateTime.ParseExact(item, new string[1] { "yyyy.MM.dd HH:mm:ss" }, new CultureInfo("zh-CN", useUserOverride: true), DateTimeStyles.AllowWhiteSpaces);
	}

	public static decimal ParseNormalDecimal(string item)
	{
		return ParseNormalDecimal(item, 0m);
	}

	public static decimal ParseNormalDecimal(string item, decimal def)
	{
		if (!decimal.TryParse(item, out var result))
		{
			return def;
		}
		return result;
	}

	public static string ParseString(string item)
	{
		return item.Replace("\v", Environment.NewLine);
	}

	public static decimal ParseDecimal(string item)
	{
		try
		{
			string[] array = item.Split(',');
			int value = int.Parse(array[0]);
			if (array.Length == 1)
			{
				return Convert.ToDecimal(value);
			}
			int num = int.Parse(array[1]);
			decimal result = Convert.ToDecimal(value);
			for (int i = 0; i < num; i++)
			{
				result /= 10m;
			}
			return result;
		}
		catch
		{
			return 0.0m;
		}
	}

	public static bool[] ParsePLUDay_value(int value)
	{
		bool[] array = new bool[7];
		for (int i = 0; i < 7; i++)
		{
			array[i] = value % 2 == 1;
			value >>= 1;
		}
		return array;
	}

	public static bool[] ParsePLUDay(string item)
	{
		int value = 0;
		try
		{
			value = int.Parse(item);
		}
		catch
		{
		}
		return ParsePLUDay_value(value);
	}

	public static int LabelRight_CalXLocaltion(Control[] tlabel)
	{
		int num = 0;
		for (int i = 0; i < tlabel.Length; i++)
		{
			num = Math.Max(num, tlabel[i].Location.X + tlabel[i].Size.Width);
		}
		return num + 10;
	}

	public static void LabelRight_SetXLocaltion(Control[] tlabel, Control[] target)
	{
		int num = 0;
		int num2 = LabelRight_CalXLocaltion(tlabel);
		num = target[0].Location.X;
		for (int i = 1; i < target.Length; i++)
		{
			num = Math.Min(num, target[i].Location.X);
		}
		for (int i = 0; i < target.Length; i++)
		{
			target[i].Location = new Point(target[i].Location.X - num + num2, target[i].Location.Y);
		}
	}

	public static int FormatPLUDay(bool day0, bool day1, bool day2, bool day3, bool day4, bool day5, bool day6)
	{
		int num = Convert.ToInt32(day0);
		int num2 = Convert.ToInt32(day1);
		int num3 = Convert.ToInt32(day2);
		int num4 = Convert.ToInt32(day3);
		int num5 = Convert.ToInt32(day4);
		int num6 = Convert.ToInt32(day5);
		int num7 = Convert.ToInt32(day6);
		return num + num2 * 2 + num3 * 4 + num4 * 8 + num5 * 16 + num6 * 32 + num7 * 64;
	}

	public static bool GetFirstPY(ref string output, char input)
	{
		try
		{
			string s = string.Concat(input);
			byte[] bytes = Encoding.GetEncoding("GB2312").GetBytes(s);
			if (bytes[0] >= 176 && bytes[0] <= 215 && bytes[1] >= 161 && bytes[1] < byte.MaxValue)
			{
				int num = (bytes[0] - 160) * 100 + (bytes[1] - 160);
				if (num >= 1601 && num < 1637)
				{
					output += 'A';
					return true;
				}
				if (num >= 1637 && num < 1833)
				{
					output += 'B';
					return true;
				}
				if (num >= 1833 && num < 2078)
				{
					output += 'C';
					return true;
				}
				if (num >= 2078 && num < 2274)
				{
					output += 'D';
					return true;
				}
				if (num >= 2274 && num < 2302)
				{
					output += 'E';
					return true;
				}
				if (num >= 2302 && num < 2433)
				{
					output += 'F';
					return true;
				}
				if (num >= 2433 && num < 2594)
				{
					output += 'G';
					return true;
				}
				if (num >= 2594 && num < 2787)
				{
					output += 'H';
					return true;
				}
				if (num >= 2787 && num < 3106)
				{
					output += 'J';
					return true;
				}
				if (num >= 3106 && num < 3212)
				{
					output += 'K';
					return true;
				}
				if (num >= 3212 && num < 3472)
				{
					output += 'L';
					return true;
				}
				if (num >= 3472 && num < 3635)
				{
					output += 'M';
					return true;
				}
				if (num >= 3635 && num < 3722)
				{
					output += 'N';
					return true;
				}
				if (num >= 3722 && num < 3730)
				{
					output += 'O';
					return true;
				}
				if (num >= 3730 && num < 3858)
				{
					output += 'P';
					return true;
				}
				if (num >= 3858 && num < 4027)
				{
					output += 'Q';
					return true;
				}
				if (num >= 4027 && num < 4086)
				{
					output += 'R';
					return true;
				}
				if (num >= 4086 && num < 4390)
				{
					output += 'S';
					return true;
				}
				if (num >= 4390 && num < 4558)
				{
					output += 'T';
					return true;
				}
				if (num >= 4558 && num < 4684)
				{
					output += 'W';
					return true;
				}
				if (num >= 4684 && num < 4925)
				{
					output += 'X';
					return true;
				}
				if (num >= 4925 && num < 5249)
				{
					output += 'Y';
					return true;
				}
				if (num >= 5249 && num < 5590)
				{
					output += 'Z';
					return true;
				}
				return false;
			}
			ChineseChar chineseChar = new ChineseChar(input);
			ReadOnlyCollection<string> pinyins = chineseChar.Pinyins;
			List<ChineseFC> list = new List<ChineseFC>(16);
			foreach (string item in pinyins)
			{
				if (item == null)
				{
					continue;
				}
				char c = item.ToCharArray()[0];
				bool flag = false;
				foreach (ChineseFC item2 in list)
				{
					if (item2.fpy == c)
					{
						item2.ct++;
						flag = true;
						break;
					}
				}
				if (!flag)
				{
					ChineseFC chineseFC = new ChineseFC();
					chineseFC.fpy = c;
					chineseFC.ct = 1;
					list.Add(chineseFC);
				}
			}
			if (list.Count == 0)
			{
				return false;
			}
			int num2 = 0;
			char c2 = ' ';
			foreach (ChineseFC item3 in list)
			{
				if (item3.ct > num2)
				{
					num2 = item3.ct;
					c2 = item3.fpy;
				}
			}
			output += c2;
			return true;
		}
		catch (Exception)
		{
		}
		return false;
	}

	public static string GetAlpha(string inputstring)
	{
		char[] array = inputstring.ToCharArray();
		string output = "";
		char[] array2 = array;
		foreach (char c in array2)
		{
			if (c >= 'a' && c <= 'z')
			{
				output += c;
			}
			else if (c >= 'A' && c <= 'Z')
			{
				output += c;
			}
			else if (c > ' ' && c < '~')
			{
				if (output.Length > 0)
				{
					output += c;
				}
			}
			else
			{
				GetFirstPY(ref output, c);
			}
			if (output.Length >= 14)
			{
				break;
			}
		}
		return output.ToLower();
	}

	public static string FormatString(string item)
	{
		return item.Replace(Environment.NewLine, "\v");
	}

	public static string FormatDecimal(decimal d, DecimalFormat format)
	{
		switch (format)
		{
		case DecimalFormat.Price:
			d = Math.Round(d, Settings.Default.Format_Price);
			break;
		case DecimalFormat.Weight:
			d = Math.Round(d, Settings.Default.Format_Weight);
			break;
		}
		if (d > 9999999m)
		{
			return "0,0";
		}
		if (d < -9999999m)
		{
			return "0,0";
		}
		int num = 0;
		decimal num2 = d;
		while (num2 <= 999999.9m && num2 >= -999999.9m && num2 != decimal.Round(num2, 0) && num < 7)
		{
			num2 *= 10m;
			num++;
		}
		return $"{Convert.ToInt32(num2)},{num}";
	}

	public static int Power10(int d)
	{
		int num = 1;
		while (d > 0)
		{
			d--;
			num *= 10;
		}
		return num;
	}

	public static int DecimalInInt(decimal d)
	{
		if (d > 9999999m)
		{
			return 0;
		}
		if (d < -9999999m)
		{
			return 0;
		}
		int num = 0;
		decimal num2 = d;
		while (num2 <= 999999.9m && num2 >= -999999.9m && num2 != decimal.Round(num2, 0) && num < 7)
		{
			num2 *= 10m;
			num++;
		}
		return Convert.ToInt32(num2) * 8 + num;
	}

	public static decimal IntInDecimal(int d)
	{
		decimal result = d >> 3;
		for (d &= 7; d > 0; d--)
		{
			result /= 10m;
		}
		return result;
	}

	public static void WriteFileLine(string FileName, string Line)
	{
		try
		{
			Line = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " " + Line;
			StreamWriter streamWriter = File.AppendText(FileName);
			streamWriter.WriteLine(Line);
			streamWriter.Close();
		}
		catch (Exception)
		{
		}
	}

	public static void Public_Cal_NewSCP(ref ECSDataSet eCSDataSet, string newname)
	{
		ECSDataSet.FaceListRow faceListRow = eCSDataSet.FaceList.NewFaceListRow();
		faceListRow.ScaleID = newname;
		faceListRow.Layout = Settings.Default.defaultSCP;
		faceListRow.PageMode = Settings.Default.defaultSCP_Page;
		eCSDataSet.FaceList.AddFaceListRow(faceListRow);
		for (int i = 0; i < 128; i++)
		{
			ECSDataSet.FaceRow faceRow = eCSDataSet.Face.NewFaceRow();
			faceRow.ScaleID = newname;
			faceRow.PageID = i / 64;
			faceRow.KeyID = i % 64;
			faceRow.PLUID = 0;
			eCSDataSet.Face.AddFaceRow(faceRow);
		}
	}

	private static void MergeUIDataSet(UIDataSet uiDataSet, string fileName)
	{
		if (!File.Exists(fileName))
		{
			return;
		}
		using UIDataSet uIDataSet = new UIDataSet();
		try
		{
			uIDataSet.ReadXml(fileName);
			uiDataSet.Merge(uIDataSet);
		}
		catch (Exception)
		{
		}
	}

	private static void MergeXML(string fileName)
	{
		string fileName2 = $"{Application.StartupPath}\\{fileName}";
		string name = Thread.CurrentThread.CurrentUICulture.Parent.Name;
		string name2 = Thread.CurrentThread.CurrentUICulture.Name;
		string configFolder = Settings.Default.configFolder;
		string text = $"{Application.StartupPath}\\Config\\{fileName}";
		string fileName3 = $"{Application.StartupPath}\\{name}\\{fileName}";
		string text2 = $"{Application.StartupPath}\\{name2}\\{fileName}";
		string fileName4 = $"{Application.StartupPath}\\Config\\{configFolder}\\{fileName}";
		using UIDataSet uIDataSet = new UIDataSet();
		MergeUIDataSet(uIDataSet, fileName3);
		if (File.Exists(text2))
		{
			MergeUIDataSet(uIDataSet, text2);
		}
		MergeUIDataSet(uIDataSet, fileName4);
		if (File.Exists(text))
		{
			MergeUIDataSet(uIDataSet, text);
		}
		uIDataSet.WriteXml(fileName2);
	}

	private static void MergeConfigFile(ClientSettingsSection dstSection, string fileName, string groups)
	{
		if (!File.Exists(fileName))
		{
			return;
		}
		try
		{
			ExeConfigurationFileMap exeConfigurationFileMap = new ExeConfigurationFileMap();
			exeConfigurationFileMap.ExeConfigFilename = fileName;
			Configuration configuration = ConfigurationManager.OpenMappedExeConfiguration(exeConfigurationFileMap, ConfigurationUserLevel.None);
			ClientSettingsSection clientSettingsSection = configuration.SectionGroups[groups].Sections["ECS.Properties.Settings"] as ClientSettingsSection;
			foreach (SettingElement setting in clientSettingsSection.Settings)
			{
				SettingElement settingElement2 = dstSection.Settings.Get(setting.Name);
				if (settingElement2 != null)
				{
					if (settingElement2.Value.ValueXml.InnerText != setting.Value.ValueXml.InnerText)
					{
						settingElement2.Value.ValueXml.InnerText = setting.Value.ValueXml.InnerText;
					}
				}
				else
				{
					dstSection.Settings.Add(setting);
				}
			}
		}
		catch (Exception ex)
		{
			_ = ex.Message;
		}
	}

	private static void MergeSettings()
	{
		string text = "TM-xA.exe.config";
		string name = Thread.CurrentThread.CurrentUICulture.Parent.Name;
		string name2 = Thread.CurrentThread.CurrentUICulture.Name;
		string configFolder = Settings.Default.configFolder;
		string fileName = $"{Application.StartupPath}\\Config\\{text}";
		string fileName2 = $"{Application.StartupPath}\\{name}\\{text}";
		string fileName3 = $"{Application.StartupPath}\\{name2}\\{text}";
		string fileName4 = $"{Application.StartupPath}\\Config\\{configFolder}\\{text}";
		Configuration configuration = ConfigurationManager.OpenExeConfiguration(ConfigurationUserLevel.None);
		ClientSettingsSection dstSection = configuration.SectionGroups["applicationSettings"].Sections["ECS.Properties.Settings"] as ClientSettingsSection;
		MergeConfigFile(dstSection, fileName, "applicationSettings");
		MergeConfigFile(dstSection, fileName2, "applicationSettings");
		MergeConfigFile(dstSection, fileName3, "applicationSettings");
		MergeConfigFile(dstSection, fileName4, "applicationSettings");
		configuration.Save(ConfigurationSaveMode.Minimal, forceSaveAll: true);
		dstSection = configuration.SectionGroups["userSettings"].Sections["ECS.Properties.Settings"] as ClientSettingsSection;
		MergeConfigFile(dstSection, fileName, "userSettings");
		MergeConfigFile(dstSection, fileName2, "userSettings");
		MergeConfigFile(dstSection, fileName3, "userSettings");
		MergeConfigFile(dstSection, fileName4, "userSettings");
		configuration.Save(ConfigurationSaveMode.Minimal, forceSaveAll: true);
		Settings.Default.Reload();
	}

	public static string Config_GetCurrentLang()
	{
		return Thread.CurrentThread.CurrentUICulture.Parent.Name;
	}

	private static void MergeConfig()
	{
		try
		{
			MergeXML("Combo.xml");
			MergeXML("LabelItem.xml");
			MergeXML("Tm.xml");
			MergeXML("Lang.xml");
			MergeCustum();
			MergeSettings();
			string fileName = Application.StartupPath + "\\Lang.xml";
			ForLang.Lang.ReadXml(fileName);
			LangSocket.Clear();
			UIDataSet.LangRow langRow = ForLang.Lang.FindByName("pw_LangSocket");
			if (langRow == null)
			{
				return;
			}
			string[] array = langRow.Display.Split('|');
			string[] array2 = array;
			foreach (string text in array2)
			{
				if (text.Length != 0 && !LangSocket.Contains(text))
				{
					LangSocket.Add(text);
				}
			}
		}
		catch
		{
		}
	}

	public static string GetLang(string name)
	{
		UIDataSet.LangRow langRow = ForLang.Lang.FindByName(name);
		if (langRow != null)
		{
			return langRow.Display;
		}
		return name;
	}

	public static string GetLang_Plus(string name)
	{
		switch (name)
		{
		case "pw_Payment1":
			if (Settings.Default.Text_Payment1.Length > 0)
			{
				return Settings.Default.Text_Payment1;
			}
			break;
		case "pw_Payment2":
			if (Settings.Default.Text_Payment2.Length > 0)
			{
				return Settings.Default.Text_Payment2;
			}
			break;
		case "pw_Payment3":
			if (Settings.Default.Text_Payment3.Length > 0)
			{
				return Settings.Default.Text_Payment3;
			}
			break;
		}
		return GetLang(name);
	}

	private static void MergeCustum()
	{
		string text = "Custom.xml";
		string configFolder = Settings.Default.configFolder;
		string destFileName = $"{Application.StartupPath}\\{text}";
		string text2 = $"{Application.StartupPath}\\Config\\{configFolder}\\{text}";
		string sourceFileName = $"{Application.StartupPath}\\Config\\{text}";
		if (File.Exists(text2))
		{
			File.Copy(text2, destFileName, overwrite: true);
		}
		else
		{
			File.Copy(sourceFileName, destFileName, overwrite: true);
		}
	}

	public static void CompactAccess(string from, string to)
	{
		if (!File.Exists(from))
		{
			throw new Exception("Database Not Exist");
		}
		bool flag = false;
		if (string.IsNullOrEmpty(to) || from == to)
		{
			to = DateTime.Now.Year.ToString();
			to += DateTime.Now.Month;
			to += DateTime.Now.Day;
			to += DateTime.Now.Hour;
			to += DateTime.Now.Minute;
			to = to + DateTime.Now.Second + ".bak";
			to = from.Substring(0, from.LastIndexOf("\\") + 1) + to;
			flag = true;
		}
		string destconnection = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" + to + ";Jet OLEDB:Database Password=showmethemoney";
		string sourceConnection = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" + from + ";Jet OLEDB:Database Password=showmethemoney";
		JetEngineClass jetEngineClass = new JetEngineClass();
		if (File.Exists(to))
		{
			File.Delete(to);
		}
		jetEngineClass.CompactDatabase(sourceConnection, destconnection);
		if (flag)
		{
			File.Copy(to, from, overwrite: true);
			File.Delete(to);
		}
	}

	[DllImport("User32.dll")]
	private static extern bool ShowWindowAsync(IntPtr hWnd, int cmdShow);

	[DllImport("User32.dll")]
	private static extern bool SetForegroundWindow(IntPtr hWnd);

	[DllImport("user32.dll")]
	private static extern IntPtr GetTopWindow(IntPtr hWnd);

	[DllImport("user32.dll")]
	private static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

	[DllImport("user32.dll")]
	private static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

	[DllImport("user32.dll")]
	private static extern IntPtr GetWindow(IntPtr hWnd, uint uCmd);

	[DllImport("user32.dll")]
	private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

	[STAThread]
	private static void Main(string[] args)
	{
		Application.EnableVisualStyles();
		Application.SetCompatibleTextRenderingDefault(defaultValue: true);
		string text = Application.StartupPath + "\\\\user_config.bck";
		try
		{
			Settings.Default.Reload();
			_ = Settings.Default.reboot;
			string filePath = ConfigurationManager.OpenExeConfiguration(ConfigurationUserLevel.PerUserRoamingAndLocal).FilePath;
			if (File.Exists(filePath))
			{
				File.Copy(filePath, text, overwrite: true);
			}
		}
		catch (ConfigurationErrorsException ex)
		{
			string filename = ((ConfigurationErrorsException)ex.InnerException).Filename;
			File.Delete(filename);
			if (File.Exists(text))
			{
				File.Move(text, filename);
			}
			Application.Restart();
			return;
		}
		if (!Settings.Default.reboot)
		{
			Process currentProcess = Process.GetCurrentProcess();
			Process[] processesByName = Process.GetProcessesByName(currentProcess.ProcessName);
			Process[] array = processesByName;
			foreach (Process process in array)
			{
				if (process.Id == currentProcess.Id || !(process.MainModule.FileName == currentProcess.MainModule.FileName))
				{
					continue;
				}
				IntPtr intPtr = process.MainWindowHandle;
				if (intPtr == IntPtr.Zero)
				{
					IntPtr intPtr2 = GetTopWindow(IntPtr.Zero);
					while (intPtr2 != IntPtr.Zero)
					{
						GetWindowThreadProcessId(intPtr2, out var lpdwProcessId);
						if (lpdwProcessId == process.Id)
						{
							StringBuilder stringBuilder = new StringBuilder(200);
							GetWindowText(intPtr2, stringBuilder, 200);
							if (stringBuilder.ToString().Contains(GetLang("pw_TM_xAManagementProgram") + Resources.Version))
							{
								intPtr = intPtr2;
								break;
							}
						}
						intPtr2 = GetWindow(intPtr2, GW_HWNDNEXT);
					}
				}
				ShowWindowAsync(intPtr, 1);
				SetForegroundWindow(intPtr);
				return;
			}
		}
		else
		{
			Settings.Default.reboot = false;
			Settings.Default.Save();
		}
		string configFolder = Settings.Default.configFolder;
		if (configFolder.Length == 0 || !Directory.Exists(Application.StartupPath + "\\Config\\" + configFolder))
		{
			UIDataSet uIDataSet = new UIDataSet();
			string fileName = Application.StartupPath + "\\Config\\Config.xml";
			uIDataSet.Config.ReadXml(fileName);
			UIDataSet.ConfigRow configRow = (UIDataSet.ConfigRow)uIDataSet.Config.Rows[0];
			Thread currentThread = Thread.CurrentThread;
			CultureInfo currentCulture = (Thread.CurrentThread.CurrentUICulture = new CultureInfo(configRow.Lang));
			currentThread.CurrentCulture = currentCulture;
			using ConfigForm configForm = new ConfigForm();
			configForm.ShowDialog();
			return;
		}
		using (UIDataSet uIDataSet2 = new UIDataSet())
		{
			string fileName2 = Application.StartupPath + "\\Config\\Config.xml";
			uIDataSet2.Config.ReadXml(fileName2);
			UIDataSet.ConfigRow configRow2 = uIDataSet2.Config.FindByName(Settings.Default.configName);
			if (configRow2 == null)
			{
				using ConfigForm configForm2 = new ConfigForm();
				configForm2.ShowDialog();
				return;
			}
			Thread currentThread2 = Thread.CurrentThread;
			CultureInfo currentCulture2 = (Thread.CurrentThread.CurrentUICulture = new CultureInfo(configRow2.Lang));
			currentThread2.CurrentCulture = currentCulture2;
		}
		MergeConfig();
		SettingsBase settingsBase;
		(settingsBase = Settings.Default)["ECSConnectionString"] = string.Concat(settingsBase["ECSConnectionString"], ";Jet OLEDB:Database Password=showmethemoney");
		SettingsBase settingsBase2;
		(settingsBase2 = Settings.Default)["_ECSConnectionString"] = string.Concat(settingsBase2["_ECSConnectionString"], ";Jet OLEDB:Database Password=showmethemoney");
		SettingsBase settingsBase3;
		(settingsBase3 = Settings.Default)["ReportConnectionString"] = string.Concat(settingsBase3["ReportConnectionString"], ";Jet OLEDB:Database Password=showmethemoney");
		SettingsBase settingsBase4;
		(settingsBase4 = Settings.Default)["_ReportConnectionString"] = string.Concat(settingsBase4["_ReportConnectionString"], ";Jet OLEDB:Database Password=showmethemoney");
		CheckDirty();
		Settings.Default.dirty = false;
		Settings.Default.Save();
		DateTime now = DateTime.Now;
		Directory.CreateDirectory(Application.StartupPath + "\\Report\\Backup");
		string text2 = Application.StartupPath + "\\Report.mdb";
		string text3 = Application.StartupPath + "\\Report\\Backup\\" + now.ToString("yyyyMMdd") + ".mdb";
		File.Delete(text3);
		CompactAccess(text2, text3);
		File.Copy(text3, text2, overwrite: true);
		string strB = now.AddDays(-32.0).ToString("yyyyMMdd");
		string[] files = Directory.GetFiles(Application.StartupPath + "\\Report\\Backup\\", "*.mdb", SearchOption.TopDirectoryOnly);
		string[] array2 = files;
		foreach (string path in array2)
		{
			if (string.Compare(Path.GetFileName(path), strB) < 0)
			{
				File.Delete(path);
			}
		}
		ReportDatabaseReducer();
		RDS.PLUImportKeep_Get();
		using ManagerForm managerForm = new ManagerForm(args);
		managerForm.ADF_CheckBox.Visible = true;
		if (managerForm.ShowDialog() != DialogResult.OK)
		{
			return;
		}
		Settings.Default.dirty = true;
		if (managerForm.ADF_CheckBox.Checked)
		{
			using MenuParameterForm menuParameterForm = new MenuParameterForm();
			if (menuParameterForm.ShowDialog() != DialogResult.OK)
			{
				Settings.Default.Save();
			}
		}
		else
		{
			Settings.Default.Save();
		}
		MainForm mainForm = new MainForm(args);
		Application.Run(mainForm);
		SaveDirty();
		Settings.Default.dirty = false;
		Settings.Default.Save();
	}

	private static void ReportDatabaseReducer()
	{
		if (Settings.Default.gen_RDRD < 3)
		{
			return;
		}
		LogTableAdapter logTableAdapter = new LogTableAdapter();
		LogItemTableAdapter logItemTableAdapter = new LogItemTableAdapter();
		StockItemTableAdapter stockItemTableAdapter = new StockItemTableAdapter();
		HistoryTableAdapter historyTableAdapter = new HistoryTableAdapter();
		DateTime? dateTime = logTableAdapter.DT_Max();
		DateTime? dateTime2 = logTableAdapter.DT_Max();
		DateTime dateTime3;
		if (dateTime.HasValue)
		{
			dateTime3 = ((!dateTime2.HasValue) ? dateTime.Value : ((dateTime.Value > dateTime2.Value) ? dateTime.Value : dateTime2.Value));
		}
		else
		{
			if (!dateTime2.HasValue)
			{
				return;
			}
			dateTime3 = dateTime2.Value;
		}
		if (DateTime.Now < dateTime3.Date)
		{
			return;
		}
		dateTime = logTableAdapter.DT_Min();
		dateTime2 = logTableAdapter.DT_Min();
		DateTime dateTime4;
		if (dateTime.HasValue)
		{
			dateTime4 = ((!dateTime2.HasValue) ? dateTime.Value : ((dateTime.Value < dateTime2.Value) ? dateTime.Value : dateTime2.Value));
		}
		else
		{
			if (!dateTime2.HasValue)
			{
				return;
			}
			dateTime4 = dateTime2.Value;
		}
		TimeSpan timeSpan = new TimeSpan(dateTime3.Date.Ticks);
		if (timeSpan.Subtract(new TimeSpan(dateTime4.Date.Ticks)).Duration().Days > Settings.Default.gen_RDRD)
		{
			File.Copy(Application.StartupPath + "\\Report.mdb", Application.StartupPath + "\\_Report.mdb", overwrite: true);
			DateTime dateTime5 = dateTime3.Date.AddDays(-(Settings.Default.gen_RDRD * 2 / 3));
			OleDbConnection connection = new OleDbConnection(Settings.Default._ReportConnectionString);
			OleDbConnection connection2 = logTableAdapter.Connection;
			ReportDataSet reportDataSet = new ReportDataSet();
			logTableAdapter.Connection = connection;
			logItemTableAdapter.Connection = connection;
			stockItemTableAdapter.Connection = connection;
			historyTableAdapter.Connection = connection;
			logItemTableAdapter.Delete_DT_BigE(dateTime5);
			logTableAdapter.Delete_DT_BigE(dateTime5);
			stockItemTableAdapter.Delete_DT_BigE(dateTime5);
			historyTableAdapter.Fill(reportDataSet.History);
			ReportDataSet.HistoryRow historyRow = reportDataSet.History.FindByFileName("this");
			historyRow.End = dateTime5;
			string text = historyRow.Start.ToString("yyyyMMdd") + "_" + dateTime5.AddDays(-1.0).ToString("yyyyMMdd");
			historyTableAdapter.Update(reportDataSet.History);
			Directory.CreateDirectory(Application.StartupPath + "\\Report\\OldLogs");
			CompactAccess(Application.StartupPath + "\\_Report.mdb", Application.StartupPath + "\\Report\\OldLogs\\" + text + ".mdb");
			logTableAdapter.Connection = connection2;
			logItemTableAdapter.Connection = connection2;
			stockItemTableAdapter.Connection = connection2;
			historyTableAdapter.Connection = connection2;
			File.Delete(Application.StartupPath + "\\_Report.mdb");
			logItemTableAdapter.Delete_DT_Small(dateTime5);
			logTableAdapter.Delete_DT_Small(dateTime5);
			stockItemTableAdapter.Delete_DT_Small(dateTime5);
			historyTableAdapter.Fill(reportDataSet.History);
			historyRow = reportDataSet.History.FindByFileName("this");
			ReportDataSet.HistoryRow historyRow2 = reportDataSet.History.NewHistoryRow();
			historyRow2.FileName = text;
			historyRow2.Start = historyRow.Start;
			ReportDataSet.HistoryRow historyRow3 = historyRow;
			DateTime start = (historyRow2.End = dateTime5);
			historyRow3.Start = start;
			reportDataSet.History.AddHistoryRow(historyRow2);
			historyTableAdapter.Update(reportDataSet.History);
			CompactAccess(Application.StartupPath + "\\Report.mdb", null);
		}
	}

	public static void CheckDirty()
	{
		string destFileName = $"{Application.StartupPath}\\Config\\{Settings.Default.configFolder}\\{Settings.Default.fileName}.mdb";
		string destFileName2 = $"{Application.StartupPath}\\Config\\{Settings.Default.configFolder}\\{Settings.Default.fileName}.sbp";
		string text = Application.StartupPath + "\\ECS.mdb";
		string sourceFileName = Application.StartupPath + "\\ECS.sbp";
		if (Settings.Default.dirty && File.Exists(text) && MessageBox.Show(GetLang("pw_Doyouwanttorestoreformlyunsaveddata_"), GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
		{
			File.Copy(text, destFileName, overwrite: true);
			File.Copy(sourceFileName, destFileName2, overwrite: true);
		}
	}

	public static void SaveAlways()
	{
		string text = $"{Application.StartupPath}\\Config\\{Settings.Default.configFolder}\\{Settings.Default.fileName}.mdb";
		string destFileName = $"{Application.StartupPath}\\Config\\{Settings.Default.configFolder}\\{Settings.Default.fileName}.sbp";
		string text2 = Application.StartupPath + "\\ECS.mdb";
		string text3 = Application.StartupPath + "\\ECS2.mdb";
		string text4 = Application.StartupPath + "\\ECS.sbp";
		if (File.Exists(text2) && File.Exists(text4))
		{
			File.Delete(text);
			CompactAccess(text2, text3);
			File.Copy(text3, text, overwrite: true);
			File.Copy(text4, destFileName, overwrite: true);
		}
	}

	public static void SaveDirty()
	{
		if (!Settings.Default.dirty)
		{
			return;
		}
		if (Settings.Default.alwaysShowDirty && !NoAskDirty)
		{
			using (PromptForm promptForm = new PromptForm())
			{
				if (promptForm.ShowDialog() == DialogResult.Yes)
				{
					SaveAlways();
				}
				if (promptForm.DontAsk)
				{
					Settings.Default.alwaysShowDirty = false;
					Settings.Default.Save();
				}
				return;
			}
		}
		SaveAlways();
	}

	public static void GetStockMultiItem(ref ReportDataSet ctReportDataSet, ECSDataSet ctECSDataSet, int ctGID)
	{
		ctReportDataSet.StockMultiItem.Clear();
		foreach (ReportDataSet.StockRow item in ctReportDataSet.Stock)
		{
			if (item.GID == ctGID)
			{
				ReportDataSet.StockMultiItemRow stockMultiItemRow = ctReportDataSet.StockMultiItem.NewStockMultiItemRow();
				stockMultiItemRow.PLU = item.PLU;
				stockMultiItemRow.STakingTime = item.STakingTime;
				stockMultiItemRow.Stock = item.Amount;
				stockMultiItemRow.Unit = item.Unit;
				stockMultiItemRow.StockSP = item.AmountSP;
				stockMultiItemRow.UnitSP = item.UnitSP;
				stockMultiItemRow.SafetyStock = item.SafetyStock;
				stockMultiItemRow.LowStock = item.LowStock;
				stockMultiItemRow.Type = -1;
				stockMultiItemRow.Amount = 0m;
				stockMultiItemRow.Unit_Price = 0m;
				decimal priceIn = (stockMultiItemRow.PriceOut = 0m);
				stockMultiItemRow.PriceIn = priceIn;
				ctReportDataSet.StockMultiItem.AddStockMultiItemRow(stockMultiItemRow);
			}
		}
		foreach (ECSDataSet.PLURow item2 in ctECSDataSet.PLU)
		{
			ReportDataSet.StockMultiItemRow stockMultiItemRow2 = ctReportDataSet.StockMultiItem.FindByPLU(item2.PLUID);
			if (stockMultiItemRow2 != null)
			{
				stockMultiItemRow2.PriceIn = item2.Cost;
				stockMultiItemRow2.PriceOut = item2.Price;
				if (item2.UnitID == 0 || ctECSDataSet.Unit.FindByUnitID(stockMultiItemRow2.Unit).Punit == ctECSDataSet.Unit.FindByUnitID(item2.UnitID).Punit)
				{
					continue;
				}
				if (stockMultiItemRow2.UnitSP == 0)
				{
					stockMultiItemRow2.Stock = 0m;
					stockMultiItemRow2.Unit = item2.UnitID;
					if (stockMultiItemRow2.Unit <= 1)
					{
						stockMultiItemRow2.Unit = Settings.Default.Report_DefaultWeight;
					}
				}
				else
				{
					stockMultiItemRow2.Stock = stockMultiItemRow2.StockSP;
					stockMultiItemRow2.Unit = stockMultiItemRow2.UnitSP;
				}
				continue;
			}
			stockMultiItemRow2 = ctReportDataSet.StockMultiItem.NewStockMultiItemRow();
			stockMultiItemRow2.PLU = item2.PLUID;
			stockMultiItemRow2.STakingTime = new DateTime(2000, 1, 1, 0, 0, 0);
			stockMultiItemRow2.Stock = 0m;
			stockMultiItemRow2.Unit = item2.UnitID;
			if (stockMultiItemRow2.Unit <= 1)
			{
				stockMultiItemRow2.Unit = Settings.Default.Report_DefaultWeight;
			}
			stockMultiItemRow2.SafetyStock = 0m;
			stockMultiItemRow2.LowStock = false;
			stockMultiItemRow2.Type = -1;
			stockMultiItemRow2.Amount = 0m;
			stockMultiItemRow2.Unit_Price = 0m;
			stockMultiItemRow2.PriceIn = item2.Cost;
			stockMultiItemRow2.PriceOut = item2.Price;
			ctReportDataSet.StockMultiItem.AddStockMultiItemRow(stockMultiItemRow2);
		}
	}

	[DllImport("user32.dll")]
	private static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

	public static long GetLastInputTime()
	{
		LASTINPUTINFO plii = default(LASTINPUTINFO);
		plii.cbSize = Marshal.SizeOf(plii);
		if (!GetLastInputInfo(ref plii))
		{
			return 0L;
		}
		return Environment.TickCount - plii.dwTime;
	}
}
