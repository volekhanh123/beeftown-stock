using System;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;
using ECS.ReportDataSetTableAdapters;
using Microsoft.Win32;

namespace ECS;

public class MainForm : Form
{
	private delegate void goRedockEthernet_Callback();

	private delegate void goClosed_Callback();

	private delegate void CloseThread_BW_Callback();

	public enum MF_QUIT_FUC
	{
		ForceExit,
		Nothing,
		ReStart,
		ResetReport,
		BackupReport,
		RestoreReport
	}

	public GuiderForm m_guiderForm;

	public NetForm m_netForm;

	public ReportForm m_reportForm;

	private DeptForm m_deptForm;

	private ClassForm m_classForm;

	private PluForm m_pluForm;

	private Co_BoxPcsForm m_coBoxPcsForm;

	private Co_ProMatForm m_coProMatForm;

	private LabelForm m_labelForm;

	private BarcodeForm m_barcodeForm;

	private UnitForm m_unitForm;

	private SalesmanForm m_salesmanForm;

	private VIPForm m_vipForm;

	private SpecForm m_specForm;

	private StringForm m_stringForm;

	private FaceForm m_faceForm;

	private BitmapForm m_bitmapForm;

	private CustomForm m_customForm_1;

	private CustomForm m_customForm_2;

	private CustomForm m_customForm_3;

	private CustomForm m_customForm_4;

	private string[] args;

	public string startup;

	private Thread redockEthernetThread;

	private ToolStripMenuItem Custum1_tsmi;

	private ToolStripMenuItem Custum2_tsmi;

	private ToolStripMenuItem Custum3_tsmi;

	private ToolStripMenuItem Custum4_tsmi;

	private Thread closeThread;

	private bool closeFinish;

	private bool closing;

	private bool noTrayIcon;

	public MF_QUIT_FUC mf_quit_fuc;

	private string mf_quit_p1 = "";

	private int reportDelayTimer_Count;

	public bool mf_focused;

	private DateTime DeAct_Time = DateTime.Now;

	private IContainer components;

	private MenuStrip menuStrip;

	private ToolStripMenuItem fileToolStripMenuItem;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripMenuItem exitToolStripMenuItem;

	private ToolStripMenuItem tmSetToolStripMenuItem;

	private ToolStripMenuItem helpToolStripMenuItem;

	private ToolStripMenuItem aboutToolStripMenuItem;

	private ToolStripMenuItem windowToolStripMenuItem;

	private ToolStripMenuItem cascadeToolStripMenuItem;

	private ToolStripMenuItem arrangeToolStripMenuItem;

	private ToolStripMenuItem dtSetToolStripMenuItem;

	private ToolStripMenuItem verticalToolStripMenuItem;

	private ToolStripMenuItem horizonalToolStripMenuItem;

	private ToolStripMenuItem closeAllToolStripMenuItem;

	private ToolStripMenuItem importToolStripMenuItem;

	private ToolStripMenuItem importFromFileToolStripMenuItem;

	private ToolStripMenuItem importFormNetToolStripMenuItem;

	private ToolStripMenuItem passwordToolStripMenuItem;

	private ToolStripMenuItem managerToolStripMenuItem;

	private ToolStripSeparator toolStripSeparator4;

	private ToolStripMenuItem importFromExcelToolStripMenuItem;

	private ToolStripMenuItem langToolStripMenuItem;

	private ToolStripMenuItem chmToolStripMenuItem;

	private ToolStripMenuItem importFromReportToolStripMenuItem;

	private ToolStripMenuItem fontBuilderToolStripMenuItem;

	private ToolStripMenuItem promptDirtyToolStripMenuItem;

	private ToolStripMenuItem designerToolStripMenuItem;

	private ToolStripSeparator toolStripSeparator5;

	private ToolStripMenuItem flagToolStripMenuItem;

	private ToolStripMenuItem importFromTXTToolStripMenuItem;

	private ToolStripMenuItem hideAllToolStripMenuItem;

	private ToolStripSeparator toolStripSeparator6;

	private NotifyIcon notifyIcon;

	private SGroupTableAdapter sGroupTableAdapter;

	public ToolStripMenuItem specToolStripMenuItem;

	public ToolStripMenuItem stringToolStripMenuItem;

	public ToolStripMenuItem deptToolStripMenuItem;

	public ToolStripMenuItem classToolStripMenuItem;

	public ToolStripMenuItem pluToolStripMenuItem;

	public ToolStripSeparator toolStripSeparator2;

	public ToolStripMenuItem labelToolStripMenuItem;

	public ToolStripMenuItem unitToolStripMenuItem;

	public ToolStripMenuItem barcodeToolStripMenuItem;

	public ToolStripSeparator toolStripSeparator3;

	public ToolStripMenuItem salesmanToolStripMenuItem;

	public ToolStripMenuItem faceToolStripMenuItem;

	public ToolStripMenuItem vipToolStripMenuItem;

	private ToolStripMenuItem menuparaToolStripMenuItem;

	public ToolStripMenuItem wizardToolStripMenuItem;

	private StockItemTableAdapter stockItemTableAdapter;

	private StockTableAdapter stockTableAdapter;

	private LogTableAdapter logTableAdapter;

	private LogItemTableAdapter logItemTableAdapter;

	private DeviceTableAdapter deviceTableAdapter;

	private ToolStripMenuItem oStartupConfigToolStripMenuItem;

	private ContextMenuStrip icon_ContextMenuStrip;

	private ToolStripMenuItem rExitToolStripMenuItem;

	private ToolStripSeparator toolStripSeparator7;

	private ToolStripMenuItem rShowTipsToolStripMenuItem;

	private ToolStripMenuItem rOpenMainPanelToolStripMenuItem;

	private ToolStripSeparator toolStripSeparator8;

	private ToolStripMenuItem oReportToolStripMenuItem;

	private ToolStripMenuItem oResetReportToolStripMenuItem;

	private ToolStripMenuItem oBackupReportToolStripMenuItem;

	private ToolStripMenuItem oRestoreReportToolStripMenuItem;

	private System.Windows.Forms.Timer refreshDelay_Timer;

	private FaceListTableAdapter faceListTableAdapter;

	private FaceTableAdapter faceTableAdapter;

	private ECSDataSet eCSDataSet;

	private ToolStripMenuItem oOtherToolStripMenuItem;

	private ToolStripMenuItem oCoBoxPcsToolStripMenuItem;

	private ToolStripMenuItem oCoProMatToolStripMenuItem;

	public ToolStripMenuItem toolToolStripMenuItem;

	private ToolStripMenuItem bitmapToolStripMenuItem;

	private ToolStripSeparator toolStripSeparator9;

	public void DataSet_Update(string Type, string From)
	{
		if (!closing && !(From == "#NULL#"))
		{
			if (From != "RDS")
			{
				RDS.DataSet_Refresh(Type);
			}
			if (From != "SpecForm" && m_specForm != null && !m_specForm.IsDisposed)
			{
				m_specForm.DataSet_Refresh(Type);
			}
			if (From != "StringForm" && m_stringForm != null && !m_stringForm.IsDisposed)
			{
				m_stringForm.DataSet_Refresh(Type);
			}
			if (From != "DeptForm" && m_deptForm != null && !m_deptForm.IsDisposed)
			{
				m_deptForm.DataSet_Refresh(Type);
			}
			if (From != "ClassForm" && m_classForm != null && !m_classForm.IsDisposed)
			{
				m_classForm.DataSet_Refresh(Type);
			}
			if (From != "PLUForm" && m_pluForm != null && !m_pluForm.IsDisposed)
			{
				m_pluForm.DataSet_Refresh(Type);
			}
			if (From != "LabelForm" && m_labelForm != null && !m_labelForm.IsDisposed)
			{
				m_labelForm.DataSet_Refresh(Type);
			}
			if (From != "BarcodeForm" && m_barcodeForm != null && !m_barcodeForm.IsDisposed)
			{
				m_barcodeForm.DataSet_Refresh(Type);
			}
			if (From != "UnitForm" && m_unitForm != null && !m_unitForm.IsDisposed)
			{
				m_unitForm.DataSet_Refresh(Type);
			}
			if (From != "SalesmanForm" && m_salesmanForm != null && !m_salesmanForm.IsDisposed)
			{
				m_salesmanForm.DataSet_Refresh(Type);
			}
			if (From != "FaceForm" && m_faceForm != null && !m_faceForm.IsDisposed)
			{
				m_faceForm.DataSet_Refresh(Type);
			}
			if (From != "NetForm" && m_netForm != null && !m_netForm.IsDisposed)
			{
				m_netForm.DataSet_Refresh(Type);
			}
			if (From != "ReportForm" && m_reportForm != null && !m_reportForm.IsDisposed)
			{
				m_reportForm.DataSet_Refresh(Type);
			}
			if (From != "Cumstom1Form" && m_customForm_1 != null && !m_customForm_1.IsDisposed)
			{
				m_customForm_1.DataSet_Refresh(Type);
			}
			if (From != "Cumstom2Form" && m_customForm_2 != null && !m_customForm_2.IsDisposed)
			{
				m_customForm_2.DataSet_Refresh(Type);
			}
			if (From != "Cumstom3Form" && m_customForm_3 != null && !m_customForm_3.IsDisposed)
			{
				m_customForm_3.DataSet_Refresh(Type);
			}
			if (From != "Cumstom4Form" && m_customForm_4 != null && !m_customForm_4.IsDisposed)
			{
				m_customForm_4.DataSet_Refresh(Type);
			}
			if (From != "Co_BoxPcsForm" && m_coBoxPcsForm != null && !m_coBoxPcsForm.IsDisposed)
			{
				m_coBoxPcsForm.DataSet_Refresh(Type);
			}
			if (From != "Co_ProMatForm" && m_coProMatForm != null && !m_coProMatForm.IsDisposed)
			{
				m_coProMatForm.DataSet_Refresh(Type);
			}
			if (From != "BitmapForm" && m_bitmapForm != null && !m_bitmapForm.IsDisposed)
			{
				m_bitmapForm.DataSet_Refresh(Type);
			}
		}
	}

	public void MainForm_Save()
	{
		if (m_deptForm != null && !m_deptForm.IsDisposed)
		{
			m_deptForm.SaveData();
		}
		if (m_classForm != null && !m_classForm.IsDisposed)
		{
			m_classForm.SaveData();
		}
		if (m_pluForm != null && !m_pluForm.IsDisposed)
		{
			m_pluForm.SaveData();
		}
		if (m_labelForm != null && !m_labelForm.IsDisposed)
		{
			m_labelForm.SaveData();
		}
		if (m_barcodeForm != null && !m_barcodeForm.IsDisposed)
		{
			m_barcodeForm.SaveData();
		}
		if (m_unitForm != null && !m_unitForm.IsDisposed)
		{
			m_unitForm.SaveData();
		}
		if (m_salesmanForm != null && !m_salesmanForm.IsDisposed)
		{
			m_salesmanForm.SaveData();
		}
		if (m_specForm != null && !m_specForm.IsDisposed)
		{
			m_specForm.SaveData();
		}
		if (m_stringForm != null && !m_stringForm.IsDisposed)
		{
			m_stringForm.SaveData();
		}
		if (m_faceForm != null && !m_faceForm.IsDisposed)
		{
			m_faceForm.SaveData();
		}
		if (m_vipForm != null && !m_vipForm.IsDisposed)
		{
			m_vipForm.SaveData();
		}
		if (m_customForm_1 != null && !m_customForm_1.IsDisposed)
		{
			m_customForm_1.SaveData();
		}
		if (m_customForm_2 != null && !m_customForm_2.IsDisposed)
		{
			m_customForm_2.SaveData();
		}
		if (m_customForm_3 != null && !m_customForm_3.IsDisposed)
		{
			m_customForm_3.SaveData();
		}
		if (m_customForm_4 != null && !m_customForm_4.IsDisposed)
		{
			m_customForm_4.SaveData();
		}
		if (m_coBoxPcsForm != null && !m_coBoxPcsForm.IsDisposed)
		{
			m_coBoxPcsForm.SaveData();
		}
		if (m_coProMatForm != null && !m_coProMatForm.IsDisposed)
		{
			m_coProMatForm.SaveData();
		}
		if (m_bitmapForm != null && !m_bitmapForm.IsDisposed)
		{
			m_bitmapForm.SaveData();
		}
	}

	public void MainForm_Close(int lvl)
	{
		Form[] mdiChildren = base.MdiChildren;
		foreach (Form form in mdiChildren)
		{
			if (form == m_guiderForm)
			{
				if (lvl < 2)
				{
					continue;
				}
				if (m_netForm != null && !m_netForm.IsDisposed)
				{
					m_netForm.mf_Dock_End();
				}
				if (m_reportForm != null && !m_reportForm.IsDisposed)
				{
					m_reportForm.mf_Dock_End();
				}
			}
			if (form != m_netForm || m_netForm.IsDisposed || lvl > 0)
			{
				form.Close();
			}
		}
	}

	public MainForm(string[] args)
	{
		InitializeComponent();
		this.args = args;
	}

	private void MainForm_DatabaseInit()
	{
	}

	private void MainForm_Load(object sender, EventArgs e)
	{
		Program.mf = this;
		rOpenMainPanelToolStripMenuItem.Text = Program.GetLang("pw_OpenMainPanel");
		rShowTipsToolStripMenuItem.Text = Program.GetLang("pw_ShowTips");
		rExitToolStripMenuItem.Text = Program.GetLang("pw_Exit");
		oStartupConfigToolStripMenuItem.Text = Program.GetLang("pw_StartupConfig");
		wizardToolStripMenuItem.Text = Program.GetLang("pw_ConfigWizard_sW");
		aboutToolStripMenuItem.Text = Program.GetLang("pw_About_sA");
		arrangeToolStripMenuItem.Text = Program.GetLang("pw_Arrange_sA");
		barcodeToolStripMenuItem.Text = Program.GetLang("pw_Barcode_sB");
		cascadeToolStripMenuItem.Text = Program.GetLang("pw_Cascade_sC");
		chmToolStripMenuItem.Text = Program.GetLang("pw_Manual_sM");
		classToolStripMenuItem.Text = Program.GetLang("pw_Class_sC");
		closeAllToolStripMenuItem.Text = Program.GetLang("pw_CloseAll_sL");
		deptToolStripMenuItem.Text = Program.GetLang("pw_Dept_sD");
		designerToolStripMenuItem.Text = Program.GetLang("pw_CustomDesigner_sC");
		dtSetToolStripMenuItem.Text = Program.GetLang("pw_Database_sD");
		exitToolStripMenuItem.Text = Program.GetLang("pw_Exit_sX");
		faceToolStripMenuItem.Text = Program.GetLang("pw_ShortcutKey_sK");
		fileToolStripMenuItem.Text = Program.GetLang("pw_File_sF");
		flagToolStripMenuItem.Text = Program.GetLang("pw_LableDesigner_sL");
		fontBuilderToolStripMenuItem.Text = Program.GetLang("pw_FontBuilder_sF");
		helpToolStripMenuItem.Text = Program.GetLang("pw_Help_sH");
		hideAllToolStripMenuItem.Text = Program.GetLang("pw_MinimizetoSystemTray_sM");
		horizonalToolStripMenuItem.Text = Program.GetLang("pw_Horizonal_sH");
		importFormNetToolStripMenuItem.Text = Program.GetLang("pw_Ethernet_sN");
		importFromExcelToolStripMenuItem.Text = Program.GetLang("pw_ExcelCSVFile_sE");
		importFromFileToolStripMenuItem.Text = Program.GetLang("pw_TMSFile_sF");
		importFromReportToolStripMenuItem.Text = Program.GetLang("pw_Report_sR");
		importFromTXTToolStripMenuItem.Text = Program.GetLang("pw_CustomFile_sC");
		importToolStripMenuItem.Text = Program.GetLang("pw_Import_Export_sI");
		labelToolStripMenuItem.Text = Program.GetLang("pw_PrintFormat_sF");
		managerToolStripMenuItem.Text = Program.GetLang("pw_Login_sL");
		menuparaToolStripMenuItem.Text = Program.GetLang("pw_AdvancedSetting_sT");
		passwordToolStripMenuItem.Text = Program.GetLang("pw_ChangePassword_sP");
		pluToolStripMenuItem.Text = Program.GetLang("pw_PLU_sP");
		promptDirtyToolStripMenuItem.Text = Program.GetLang("pw_PromptSaveWhenExit_sS");
		salesmanToolStripMenuItem.Text = Program.GetLang("pw_Salesman_sS");
		specToolStripMenuItem.Text = Program.GetLang("pw_GlobalSpec_sS");
		stringToolStripMenuItem.Text = Program.GetLang("pw_GlobalText_sT");
		tmSetToolStripMenuItem.Text = Program.GetLang("pw_Parameter_sP");
		toolToolStripMenuItem.Text = Program.GetLang("pw_Tool_sT");
		unitToolStripMenuItem.Text = Program.GetLang("pw_Unit_sU");
		verticalToolStripMenuItem.Text = Program.GetLang("pw_Vertical_sV");
		vipToolStripMenuItem.Text = Program.GetLang("pw_VIP_sV");
		windowToolStripMenuItem.Text = Program.GetLang("pw_Windows_sW");
		oResetReportToolStripMenuItem.Text = Program.GetLang("pw_ResetReport");
		oBackupReportToolStripMenuItem.Text = Program.GetLang("pw_BackupReport");
		oRestoreReportToolStripMenuItem.Text = Program.GetLang("pw_RestoreReport");
		oReportToolStripMenuItem.Text = Program.GetLang("pw_Report");
		oCoBoxPcsToolStripMenuItem.Text = Program.GetLang("pw_PiecesInPackage");
		oCoProMatToolStripMenuItem.Text = Program.GetLang("pw_MaterialInProduct");
		oOtherToolStripMenuItem.Text = Program.GetLang("pw_Other");
		bitmapToolStripMenuItem.Text = Program.GetLang("pw_Bitmap") + "(&B)";
		Text = Program.GetLang("pw_Login");
		NotifyIcon obj = notifyIcon;
		Icon icon = (base.Icon = new Icon(Application.StartupPath + "\\Resources\\logo.ico"));
		obj.Icon = icon;
		Font = Settings.Default.CustomFont;
		LoadCustom();
		UpdateRight();
		promptDirtyToolStripMenuItem.Checked = Settings.Default.alwaysShowDirty;
		MainForm_DatabaseInit();
		RDS.DataSet_Init();
		mf_Dock_Guider_Judge();
		for (int i = 0; i < args.Length; i++)
		{
			if (string.Compare(args[i], "-A", ignoreCase: true) == 0)
			{
				PopMdiChild(ref m_netForm);
				m_netForm.GoTXTfile();
				break;
			}
			if (string.Compare(args[i], "-A0", ignoreCase: true) == 0)
			{
				PopMdiChild(ref m_netForm);
				m_netForm.GoPage(0);
				break;
			}
			if (string.Compare(args[i], "-A1", ignoreCase: true) == 0)
			{
				PopMdiChild(ref m_netForm);
				m_netForm.GoPage(1);
				break;
			}
			if (string.Compare(args[i], "-A2", ignoreCase: true) == 0)
			{
				PopMdiChild(ref m_netForm);
				m_netForm.GoPage(2);
				break;
			}
			if (string.Compare(args[i], "-A3", ignoreCase: true) == 0)
			{
				PopMdiChild(ref m_netForm);
				m_netForm.GoPage(3);
				break;
			}
			if (string.Compare(args[i], "-A4", ignoreCase: true) == 0)
			{
				PopMdiChild(ref m_netForm);
				m_netForm.GoPage(4);
				break;
			}
			if (string.Compare(args[i], "-A2A", ignoreCase: true) == 0)
			{
				PopMdiChild(ref m_netForm);
				m_netForm.GoTXTfile_wStart();
				break;
			}
			if (string.Compare(args[i], "-A3A", ignoreCase: true) == 0)
			{
				PopMdiChild(ref m_netForm);
				m_netForm.GoExcelfile_wStart();
				break;
			}
		}
		for (int j = 0; j < args.Length; j++)
		{
			if (string.Compare(args[j], "-SystemTray", ignoreCase: true) == 0)
			{
				SystemTray();
				break;
			}
		}
		Judge_Tray();
		GetStartup();
	}

	private void Judge_Tray()
	{
		if (Settings.Default.gen_AlwaysTray)
		{
			notifyIcon.Visible = true;
		}
		else if (base.Visible)
		{
			notifyIcon.Visible = false;
		}
		rShowTipsToolStripMenuItem.Checked = Settings.Default.gen_TipOfTray;
	}

	public void GetStartup()
	{
		try
		{
			RegistryKey registryKey = Registry.LocalMachine.OpenSubKey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", writable: true);
			object value = registryKey.GetValue("TM-xA");
			if (value == null)
			{
				startup = null;
				return;
			}
			string text = value.ToString();
			int num = text.IndexOf("\" ");
			if (num == -1)
			{
				startup = "";
			}
			else
			{
				startup = text.Substring(num + 2);
			}
		}
		catch
		{
			startup = null;
		}
	}

	public void SetStartup(string para)
	{
		try
		{
			RegistryKey registryKey = Registry.LocalMachine.OpenSubKey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", writable: true);
			if (para != null)
			{
				registryKey.SetValue("TM-xA", "\"" + Application.ExecutablePath + "\" " + para);
			}
			else
			{
				registryKey.DeleteValue("TM-xA");
			}
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
		GetStartup();
	}

	public void mf_Dock_Guider_Judge()
	{
		if (Settings.Default.gen_OpenGuider)
		{
			if (m_guiderForm == null || m_guiderForm.IsDisposed)
			{
				mf_Dock_Guider();
				if (Settings.Default.gen_DockingEthernet)
				{
					mf_Dock_Ethernet(YesNo: true);
				}
				if (Settings.Default.gen_DockingReport)
				{
					mf_Dock_Report(YesNo: true);
				}
			}
			m_guiderForm.ReItems();
		}
		else if (m_guiderForm != null && !m_guiderForm.IsDisposed)
		{
			if (!importFormNetToolStripMenuItem.Enabled)
			{
				mf_Dock_Ethernet(YesNo: false);
			}
			if (!importFromReportToolStripMenuItem.Enabled)
			{
				mf_Dock_Report(YesNo: false);
			}
			m_guiderForm.Close();
		}
	}

	private void mf_Dock_Guider()
	{
		PopMdiChild(ref m_guiderForm);
		m_guiderForm.mf_Dock_Start();
	}

	private void mf_Dock_Ethernet(bool YesNo)
	{
		if (YesNo)
		{
			PopMdiChild(ref m_netForm);
			importFormNetToolStripMenuItem.Enabled = false;
			m_netForm.mf_Dock_Start(m_guiderForm.ur_Panel);
			m_guiderForm.Ethernet_Docked(docked: true);
		}
		else
		{
			m_netForm.mf_Dock_End();
			importFormNetToolStripMenuItem.Enabled = true;
			m_guiderForm.Ethernet_Docked(docked: false);
		}
	}

	private void mf_Dock_Ethernet()
	{
		bool flag = false;
		if (!flag && importFormNetToolStripMenuItem.Enabled)
		{
			flag = true;
		}
		mf_Dock_Ethernet(flag);
	}

	private void mf_Dock_Report(bool YesNo)
	{
		if (YesNo)
		{
			PopMdiChild(ref m_reportForm);
			importFromReportToolStripMenuItem.Enabled = false;
			m_reportForm.mf_Dock_Start(m_guiderForm.d_Panel);
			m_guiderForm.Report_Docked(docked: true);
		}
		else
		{
			m_reportForm.mf_Dock_End();
			importFromReportToolStripMenuItem.Enabled = true;
			m_guiderForm.Report_Docked(docked: false);
		}
	}

	private void mf_Dock_Report()
	{
		bool flag = false;
		if (!flag && importFromReportToolStripMenuItem.Enabled)
		{
			flag = true;
		}
		mf_Dock_Report(flag);
	}

	public void PopMdiChild(string name)
	{
		switch (name)
		{
		case "report":
			PopMdiChild(ref m_reportForm);
			break;
		case "label":
			PopMdiChild(ref m_labelForm);
			break;
		case "salesman":
			PopMdiChild(ref m_salesmanForm);
			break;
		}
	}

	public void PopMdiChild_Ethernet_Hold(bool Wizard, bool Spec, bool String, bool Barcode, bool Label, bool PLU, bool Face, bool Dept, bool Class, bool Unit, bool Salesman, bool SP1, bool SP2, bool SP3, bool SP4, bool VIP = false, bool Bitmap = false)
	{
		PopMdiChild(ref m_netForm);
		m_netForm.HoldToDownload(Wizard, Spec, String, Barcode, Label, PLU, Face, Dept, Class, Unit, Salesman, SP1, SP2, SP3, SP4, VIP, Bitmap);
	}

	public void ShowDialog_TMSfile_Hold(bool Wizard, bool Spec, bool String, bool Barcode, bool Label, bool PLU, bool Face, bool Dept, bool Class, bool Unit, bool Salesman, bool SP1, bool SP2, bool SP3, bool SP4, bool VIP = false, bool Bitmap = false)
	{
		MainForm_Save();
		using SaveForm saveForm = new SaveForm();
		saveForm.HoldToDownload(Wizard, Spec, String, Barcode, Label, PLU, Face, Dept, Class, Unit, Salesman, SP1, SP2, SP3, SP4, VIP, Bitmap);
		saveForm.ShowDialog(this);
	}

	public void ShowBallonTip(string a, string b)
	{
		if (Settings.Default.gen_TipOfTray && !closing)
		{
			notifyIcon.ShowBalloonTip(3000, a, b, ToolTipIcon.Info);
		}
	}

	private void PopMdiChild<T>(ref T form) where T : Form, new()
	{
		if (form == null || form.IsDisposed)
		{
			form = new T();
			form.MdiParent = this;
			form.Show();
		}
		else if (form.Dock != DockStyle.Fill)
		{
			form.Activate();
		}
	}

	private void deptToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_deptForm);
	}

	private void classToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_classForm);
	}

	private void pluToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_pluForm);
	}

	private void oCoBoxPcsToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_coBoxPcsForm);
	}

	private void oCoProMatToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_coProMatForm);
	}

	private void labelToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_labelForm);
	}

	private void unitToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_unitForm);
	}

	private void bitmapToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_bitmapForm);
	}

	private void barcodeToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_barcodeForm);
	}

	private void salesmanToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_salesmanForm);
	}

	private void vipToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_vipForm);
	}

	private void specToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_specForm);
	}

	private void stringToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_stringForm);
	}

	private void faceToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_faceForm);
	}

	private void cascadeToolStripMenuItem_Click(object sender, EventArgs e)
	{
		LayoutMdi(MdiLayout.Cascade);
	}

	private void horizonalToolStripMenuItem_Click(object sender, EventArgs e)
	{
		LayoutMdi(MdiLayout.TileHorizontal);
	}

	private void verticalToolStripMenuItem_Click(object sender, EventArgs e)
	{
		LayoutMdi(MdiLayout.TileVertical);
	}

	private void arrangToolStripMenuItem_Click(object sender, EventArgs e)
	{
		LayoutMdi(MdiLayout.ArrangeIcons);
	}

	private void closeAllToolStripMenuItem_Click(object sender, EventArgs e)
	{
		Form[] mdiChildren = base.MdiChildren;
		foreach (Form form in mdiChildren)
		{
			form.Close();
		}
	}

	private void exitToolStripMenuItem_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void aboutToolStripMenuItem_Click(object sender, EventArgs e)
	{
		using AboutBox aboutBox = new AboutBox();
		aboutBox.ShowDialog(this);
	}

	private void GoUSB()
	{
		MainForm_Save();
		using SaveForm saveForm = new SaveForm();
		saveForm.ShowDialog(this);
	}

	private void importFromFileToolStripMenuItem_Click(object sender, EventArgs e)
	{
		GoUSB();
	}

	private void GoExcel()
	{
		using ExcelForm excelForm = new ExcelForm();
		excelForm.ShowDialog(this);
	}

	private void importFromExcelToolStripMenuItem_Click(object sender, EventArgs e)
	{
		GoExcel();
	}

	private void importFromReportToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_reportForm);
	}

	private void importFormNetToolStripMenuItem_Click(object sender, EventArgs e)
	{
		PopMdiChild(ref m_netForm);
	}

	private void GoTXT()
	{
		using TXTForm tXTForm = new TXTForm();
		tXTForm.ShowDialog(this);
	}

	private void importFromTXTToolStripMenuItem_Click(object sender, EventArgs e)
	{
		GoTXT();
	}

	private void passwordToolStripMenuItem_Click(object sender, EventArgs e)
	{
		Program.SaveDirty();
		using PasswordForm passwordForm = new PasswordForm();
		passwordForm.ShowDialog(this);
	}

	public void UpdateRight()
	{
		string text = Program.right switch
		{
			Program.Right.Admin => Program.GetLang("pw_Admin"), 
			Program.Right.SuperAdmin => Program.GetLang("pw_SuperAdmin"), 
			Program.Right.User => Program.GetLang("pw_User"), 
			_ => string.Empty, 
		};
		string fileName = Settings.Default.fileName;
		Text = Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version + " - " + fileName + " < " + text + " > ";
		if (Program.right != Program.Right.SuperAdmin)
		{
			wizardToolStripMenuItem.Enabled = Settings.Default.Enable_Wizard;
			specToolStripMenuItem.Enabled = Settings.Default.Enable_TMS;
			stringToolStripMenuItem.Enabled = Settings.Default.Enable_TMT;
			faceToolStripMenuItem.Enabled = Settings.Default.Enable_SCP;
			deptToolStripMenuItem.Enabled = Settings.Default.Enable_Dept;
			classToolStripMenuItem.Enabled = Settings.Default.Enable_Class;
			ToolStripMenuItem toolStripMenuItem = oOtherToolStripMenuItem;
			bool enabled = (pluToolStripMenuItem.Enabled = Settings.Default.Enable_PLU);
			toolStripMenuItem.Enabled = enabled;
			labelToolStripMenuItem.Enabled = Settings.Default.Enable_Label;
			unitToolStripMenuItem.Enabled = false;
			barcodeToolStripMenuItem.Enabled = Settings.Default.Enable_Barcode;
			salesmanToolStripMenuItem.Enabled = Settings.Default.Enable_Salesman;
			vipToolStripMenuItem.Enabled = Settings.Default.Enable_VIP;
			bitmapToolStripMenuItem.Enabled = Settings.Default.Enable_Bitmap;
			wizardToolStripMenuItem.Visible = Settings.Default.Visible_Wizard;
			specToolStripMenuItem.Visible = Settings.Default.Visible_TMS;
			stringToolStripMenuItem.Visible = Settings.Default.Visible_TMT;
			faceToolStripMenuItem.Visible = Settings.Default.Visible_SCP;
			deptToolStripMenuItem.Visible = Settings.Default.Visible_Dept;
			classToolStripMenuItem.Visible = Settings.Default.Visible_Class;
			pluToolStripMenuItem.Visible = Settings.Default.Visible_PLU;
			labelToolStripMenuItem.Visible = Settings.Default.Visible_Label;
			unitToolStripMenuItem.Visible = false;
			barcodeToolStripMenuItem.Visible = Settings.Default.Visible_Barcode;
			salesmanToolStripMenuItem.Visible = Settings.Default.Visible_Salesman;
			vipToolStripMenuItem.Visible = Settings.Default.Visible_VIP;
			bitmapToolStripMenuItem.Visible = Settings.Default.Visible_Bitmap;
			oOtherToolStripMenuItem.Visible = Settings.Default.Visible_PLU && Settings.Default.Visible_PLU_Other;
			if (Custum1_tsmi != null)
			{
				Custum1_tsmi.Enabled = Settings.Default.Enable_Custum1;
			}
			if (Custum2_tsmi != null)
			{
				Custum2_tsmi.Enabled = Settings.Default.Enable_Custum2;
			}
			if (Custum3_tsmi != null)
			{
				Custum3_tsmi.Enabled = Settings.Default.Enable_Custum3;
			}
			if (Custum4_tsmi != null)
			{
				Custum4_tsmi.Enabled = Settings.Default.Enable_Custum4;
			}
			if (Program.right == Program.Right.User)
			{
				toolToolStripMenuItem.Enabled = Settings.Default.Enable_Tool;
				importFromExcelToolStripMenuItem.Enabled = Settings.Default.Enable_ExcelFile;
				importFromTXTToolStripMenuItem.Enabled = Settings.Default.Enable_CustomFile;
				menuparaToolStripMenuItem.Enabled = Settings.Default.Enable_AdvancedSetting;
			}
			else
			{
				toolToolStripMenuItem.Enabled = true;
				importFromExcelToolStripMenuItem.Enabled = true;
				importFromTXTToolStripMenuItem.Enabled = true;
				menuparaToolStripMenuItem.Enabled = true;
			}
		}
		else
		{
			ToolStripMenuItem toolStripMenuItem2 = wizardToolStripMenuItem;
			ToolStripMenuItem toolStripMenuItem3 = specToolStripMenuItem;
			ToolStripMenuItem toolStripMenuItem4 = stringToolStripMenuItem;
			ToolStripMenuItem toolStripMenuItem5 = faceToolStripMenuItem;
			ToolStripMenuItem toolStripMenuItem6 = deptToolStripMenuItem;
			ToolStripMenuItem toolStripMenuItem7 = classToolStripMenuItem;
			ToolStripMenuItem toolStripMenuItem8 = pluToolStripMenuItem;
			ToolStripMenuItem toolStripMenuItem9 = labelToolStripMenuItem;
			ToolStripMenuItem toolStripMenuItem10 = barcodeToolStripMenuItem;
			ToolStripMenuItem toolStripMenuItem11 = salesmanToolStripMenuItem;
			bool flag = (vipToolStripMenuItem.Enabled = true);
			bool flag3 = (toolStripMenuItem11.Enabled = flag);
			bool flag5 = (toolStripMenuItem10.Enabled = flag3);
			bool flag7 = (toolStripMenuItem9.Enabled = flag5);
			bool flag9 = (toolStripMenuItem8.Enabled = flag7);
			bool flag11 = (toolStripMenuItem7.Enabled = flag9);
			bool flag13 = (toolStripMenuItem6.Enabled = flag11);
			bool flag15 = (toolStripMenuItem5.Enabled = flag13);
			bool flag17 = (toolStripMenuItem4.Enabled = flag15);
			bool enabled2 = (toolStripMenuItem3.Enabled = flag17);
			toolStripMenuItem2.Enabled = enabled2;
			bitmapToolStripMenuItem.Enabled = true;
			unitToolStripMenuItem.Enabled = false;
			toolToolStripMenuItem.Enabled = true;
			if (Custum1_tsmi != null)
			{
				Custum1_tsmi.Enabled = true;
			}
			if (Custum2_tsmi != null)
			{
				Custum2_tsmi.Enabled = true;
			}
			if (Custum3_tsmi != null)
			{
				Custum3_tsmi.Enabled = true;
			}
			if (Custum4_tsmi != null)
			{
				Custum4_tsmi.Enabled = true;
			}
		}
		oReportToolStripMenuItem.Enabled = Program.right != Program.Right.User;
		if (Program.right != Program.Right.SuperAdmin)
		{
			chmToolStripMenuItem.Enabled = Settings.Default.Enable_CHM;
		}
		else
		{
			chmToolStripMenuItem.Enabled = true;
		}
		if (Settings.Default.Enable_Flag)
		{
			flagToolStripMenuItem.Visible = true;
		}
		else
		{
			flagToolStripMenuItem.Visible = Program.right == Program.Right.SuperAdmin;
		}
		if (Settings.Default.Enable_Custom)
		{
			designerToolStripMenuItem.Visible = true;
		}
		else
		{
			designerToolStripMenuItem.Visible = Program.right == Program.Right.SuperAdmin;
		}
		if (m_guiderForm != null && !m_guiderForm.IsDisposed)
		{
			m_guiderForm.ReItems();
			m_guiderForm.mf_Dock_Resize();
		}
	}

	private void goRedockEthernet()
	{
		if (base.InvokeRequired)
		{
			Invoke(new goRedockEthernet_Callback(goRedockEthernet), null);
		}
		else
		{
			mf_Dock_Ethernet(YesNo: true);
		}
	}

	private void RedockEthernetThread()
	{
		while (m_netForm != null && !m_netForm.IsDisposed)
		{
			Thread.Sleep(100);
		}
		goRedockEthernet();
	}

	private void managerToolStripMenuItem_Click(object sender, EventArgs e)
	{
		using ManagerForm managerForm = new ManagerForm(new string[0]);
		MainForm_Close(1);
		Program.SaveDirty();
		promptDirtyToolStripMenuItem.Checked = Settings.Default.alwaysShowDirty;
		if (managerForm.ShowDialog(this) == DialogResult.OK)
		{
			UpdateRight();
			if (m_netForm != null && !m_netForm.IsDisposed && m_netForm.mf_Docked)
			{
				mf_Dock_Ethernet(YesNo: false);
				redockEthernetThread = new Thread(RedockEthernetThread);
				redockEthernetThread.Name = "Redock Ethernet";
				redockEthernetThread.Start();
			}
			if (m_reportForm != null && !m_reportForm.IsDisposed && m_reportForm.mf_Docked)
			{
				mf_Dock_Report(YesNo: false);
				mf_Dock_Report(YesNo: true);
			}
			if (m_guiderForm != null && !m_guiderForm.IsDisposed)
			{
				m_guiderForm.expand_normal();
			}
		}
	}

	private void langToolStripMenuItem_Click(object sender, EventArgs e)
	{
		MainForm_Close(2);
		using ConfigForm configForm = new ConfigForm();
		configForm.ShowDialog(this);
	}

	private void chmToolStripMenuItem_Click(object sender, EventArgs e)
	{
		string url = Application.StartupPath + "\\" + Thread.CurrentThread.CurrentUICulture.Parent.Name + "\\TM-xA.chm";
		Help.ShowHelp(this, url);
	}

	private void fontBuilderToolStripMenuItem_Click(object sender, EventArgs e)
	{
		string fileName = Application.StartupPath + "\\binary\\FontBuilder.exe";
		try
		{
			Process.Start(fileName);
		}
		catch
		{
		}
	}

	private void promptDirtyToolStripMenuItem_Click(object sender, EventArgs e)
	{
		bool flag = !Settings.Default.alwaysShowDirty;
		Settings.Default.alwaysShowDirty = flag;
		Settings.Default.Save();
		promptDirtyToolStripMenuItem.Checked = flag;
	}

	private void designerToolStripMenuItem_Click(object sender, EventArgs e)
	{
		using CustomDesigner customDesigner = new CustomDesigner();
		customDesigner.ShowDialog();
		LoadCustom();
	}

	private void LoadCustom()
	{
		ToolStripItemCollection dropDownItems = dtSetToolStripMenuItem.DropDownItems;
		ToolStripSeparator value = toolStripSeparator5;
		int num = dropDownItems.IndexOf(value);
		if (num == -1)
		{
			dropDownItems.Add(value);
		}
		else
		{
			num++;
			while (num < dropDownItems.Count)
			{
				dropDownItems.RemoveAt(num);
			}
		}
		UIDataSet uIDataSet = new UIDataSet();
		string fileName = Application.StartupPath + "\\Custom.xml";
		uIDataSet.Custom.ReadXml(fileName);
		if (uIDataSet.Custom.Count > 0)
		{
			foreach (UIDataSet.CustomRow item in uIDataSet.Custom)
			{
				if (item.Visible)
				{
					ToolStripMenuItem toolStripMenuItem = new ToolStripMenuItem();
					if (string.IsNullOrEmpty(item.Menu))
					{
						item.Menu = item.Display;
					}
					toolStripMenuItem.Text = item.Menu;
					toolStripMenuItem.Tag = item;
					toolStripMenuItem.Click += menuItem_Click;
					switch (item._Table)
					{
					case "Custom1":
						Custum1_tsmi = toolStripMenuItem;
						break;
					case "Custom2":
						Custum2_tsmi = toolStripMenuItem;
						break;
					case "Custom3":
						Custum3_tsmi = toolStripMenuItem;
						break;
					case "Custom4":
						Custum4_tsmi = toolStripMenuItem;
						break;
					}
					dtSetToolStripMenuItem.DropDownItems.Add(toolStripMenuItem);
				}
			}
			return;
		}
		dropDownItems.Remove(value);
	}

	private void menuItem_Click(object sender, EventArgs e)
	{
		UIDataSet.CustomRow customRow = (sender as ToolStripMenuItem).Tag as UIDataSet.CustomRow;
		switch (customRow._Table)
		{
		case "Custom1":
			if (m_customForm_1 == null || m_customForm_1.IsDisposed)
			{
				m_customForm_1 = new CustomForm(customRow);
				m_customForm_1.MdiParent = this;
				m_customForm_1.Show();
				break;
			}
			if (m_customForm_1.WindowState == FormWindowState.Minimized)
			{
				m_customForm_1.WindowState = FormWindowState.Normal;
			}
			m_customForm_1.Activate();
			break;
		case "Custom2":
			if (m_customForm_2 == null || m_customForm_2.IsDisposed)
			{
				m_customForm_2 = new CustomForm(customRow);
				m_customForm_2.MdiParent = this;
				m_customForm_2.Show();
				break;
			}
			if (m_customForm_2.WindowState == FormWindowState.Minimized)
			{
				m_customForm_2.WindowState = FormWindowState.Normal;
			}
			m_customForm_2.Activate();
			break;
		case "Custom3":
			if (m_customForm_3 == null || m_customForm_3.IsDisposed)
			{
				m_customForm_3 = new CustomForm(customRow);
				m_customForm_3.MdiParent = this;
				m_customForm_3.Show();
				break;
			}
			if (m_customForm_3.WindowState == FormWindowState.Minimized)
			{
				m_customForm_3.WindowState = FormWindowState.Normal;
			}
			m_customForm_3.Activate();
			break;
		case "Custom4":
			if (m_customForm_4 == null || m_customForm_4.IsDisposed)
			{
				m_customForm_4 = new CustomForm(customRow);
				m_customForm_4.MdiParent = this;
				m_customForm_4.Show();
				break;
			}
			if (m_customForm_4.WindowState == FormWindowState.Minimized)
			{
				m_customForm_4.WindowState = FormWindowState.Normal;
			}
			m_customForm_4.Activate();
			break;
		}
	}

	private void flagToolStripMenuItem_Click(object sender, EventArgs e)
	{
		using FlagDesigner flagDesigner = new FlagDesigner();
		flagDesigner.ShowDialog();
		LoadCustom();
	}

	public void SystemTray()
	{
		Hide();
		notifyIcon.Visible = true;
	}

	private void hideAllToolStripMenuItem_Click(object sender, EventArgs e)
	{
		SystemTray();
	}

	private void GoMenuPara()
	{
		using MenuParameterForm menuParameterForm = new MenuParameterForm();
		if (menuParameterForm.ShowDialog(this) == DialogResult.OK)
		{
			Judge_Tray();
			if (m_netForm != null && !m_netForm.IsDisposed && m_netForm.gAsk != Settings.Default.gen_Ask)
			{
				mf_Dock_Ethernet(YesNo: false);
				redockEthernetThread = new Thread(RedockEthernetThread);
				redockEthernetThread.Name = "Redock Ethernet";
				redockEthernetThread.Start();
			}
		}
	}

	private void menuparaToolStripMenuItem_Click(object sender, EventArgs e)
	{
		GoMenuPara();
	}

	private void GoWizard()
	{
		MainForm_Save();
		MainForm_Close(0);
		using WizardForm wizardForm = new WizardForm();
		wizardForm.ShowDialog(this);
	}

	private void wizardToolStripMenuItem_Click(object sender, EventArgs e)
	{
		GoWizard();
	}

	public void Guider_Click_USB()
	{
		GoUSB();
	}

	public void Guider_Click_Ethernet()
	{
		mf_Dock_Ethernet();
	}

	public void Guider_Click_Wizard()
	{
		if (Settings.Default.Enable_Wizard)
		{
			GoWizard();
		}
		else
		{
			MessageBox.Show(this, Program.GetLang("pw_ConfigWizard") + ": " + Program.GetLang("pw_Forbidden") + Environment.NewLine, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	public void Guider_Click_Report()
	{
		mf_Dock_Report();
	}

	public void Guider_Click_Setting()
	{
		GoMenuPara();
	}

	public void Guider_Click_TXT()
	{
		GoTXT();
	}

	public void Guider_Click_Excel()
	{
		GoExcel();
	}

	private void MainForm_Resize(object sender, EventArgs e)
	{
	}

	private void goClosed()
	{
		if (base.InvokeRequired)
		{
			Invoke(new goClosed_Callback(goClosed), null);
		}
		else
		{
			Close();
		}
	}

	private void CloseThread_BW()
	{
		if (base.InvokeRequired)
		{
			Invoke(new CloseThread_BW_Callback(CloseThread_BW), null);
			return;
		}
		if (m_netForm != null && !m_netForm.IsDisposed && m_netForm.mf_Docked)
		{
			m_netForm.mf_Dock_End();
		}
		if (m_reportForm != null && !m_reportForm.IsDisposed && m_reportForm.mf_Docked)
		{
			m_reportForm.mf_Dock_End();
		}
	}

	private void CloseThread()
	{
		CloseThread_BW();
		int num = 0;
		while (m_netForm != null && !m_netForm.IsDisposed)
		{
			Thread.Sleep(100);
			num++;
			if (num > 50)
			{
				Program.SaveDirty();
				Settings.Default.dirty = false;
				Settings.Default.Save();
				mf_quit();
				return;
			}
		}
		closeFinish = true;
		goClosed();
	}

	private void MainForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		if (e.CloseReason == CloseReason.UserClosing && !noTrayIcon && Settings.Default.gen_CloseTray)
		{
			hideAllToolStripMenuItem_Click(null, null);
			e.Cancel = true;
			return;
		}
		if (e.CloseReason == CloseReason.WindowsShutDown)
		{
			Program.NoAskDirty = true;
		}
		if (!closing)
		{
			closing = true;
			closeThread = new Thread(CloseThread);
			closeThread.Name = "CloseMain";
			closeThread.Start();
			e.Cancel = true;
			return;
		}
		if (!closeFinish)
		{
			e.Cancel = true;
			return;
		}
		int num = 0;
		while (base.MdiChildren.Length != 0 && (base.MdiChildren.Length != 1 || base.MdiChildren[0] != m_guiderForm))
		{
			Thread.Sleep(100);
			num++;
			if (num > 10)
			{
				break;
			}
		}
		Program.SaveDirty();
		Settings.Default.dirty = false;
		Settings.Default.Save();
		mf_quit();
	}

	private void oStartupConfigToolStripMenuItem_Click(object sender, EventArgs e)
	{
		using StartUpForm startUpForm = new StartUpForm(startup);
		startUpForm.ShowDialog(this);
	}

	private void rExitToolStripMenuItem_Click(object sender, EventArgs e)
	{
		noTrayIcon = true;
		Close();
	}

	private void rShowTipsToolStripMenuItem_Click(object sender, EventArgs e)
	{
		Settings.Default.gen_TipOfTray = !Settings.Default.gen_TipOfTray;
		Settings.Default.Save();
		Judge_Tray();
	}

	private void rOpenMainPanelToolStripMenuItem_Click(object sender, EventArgs e)
	{
		if (!Settings.Default.gen_AlwaysTray)
		{
			notifyIcon.Visible = false;
		}
		Show();
	}

	private void notifyIcon_MouseClick(object sender, MouseEventArgs e)
	{
		if (e.Button == MouseButtons.Left)
		{
			rOpenMainPanelToolStripMenuItem_Click(null, null);
		}
	}

	private void mf_quit()
	{
		MF_QUIT_FUC mF_QUIT_FUC = mf_quit_fuc;
		mf_quit_fuc = MF_QUIT_FUC.Nothing;
		switch (mF_QUIT_FUC)
		{
		case MF_QUIT_FUC.ForceExit:
			Environment.Exit(0);
			break;
		case MF_QUIT_FUC.ReStart:
			Application.Restart();
			break;
		case MF_QUIT_FUC.ResetReport:
		{
			string text2 = Application.StartupPath + "\\";
			DateTime now2 = DateTime.Now;
			string sourceFileName2 = text2 + "Report.mdb";
			string destFileName2 = text2 + "Report_" + now2.ToString("yyMMddHHmmss") + ".mdb";
			File.Copy(sourceFileName2, destFileName2, overwrite: true);
			stockItemTableAdapter.DeleteAll();
			stockTableAdapter.DeleteAll();
			logItemTableAdapter.DeleteAll();
			logTableAdapter.DeleteAll();
			deviceTableAdapter.DeleteAll();
			sGroupTableAdapter.DeleteAll();
			Application.Restart();
			break;
		}
		case MF_QUIT_FUC.BackupReport:
		{
			StringBuilder stringBuilder = new StringBuilder(1024);
			using (ReportDataSet reportDataSet2 = new ReportDataSet())
			{
				sGroupTableAdapter.Fill(reportDataSet2.SGroup);
				deviceTableAdapter.Fill(reportDataSet2.Device);
				logTableAdapter.Fill(reportDataSet2.Log);
				logItemTableAdapter.Fill(reportDataSet2.LogItem);
				stockTableAdapter.Fill(reportDataSet2.Stock);
				stockItemTableAdapter.Fill(reportDataSet2.StockItem);
				stringBuilder.AppendLine("TM-xA Report Backup");
				foreach (ReportDataSet.SGroupRow item in reportDataSet2.SGroup)
				{
					stringBuilder.AppendLine($"sGroup\t{item.GID}\t{item.Name}\t");
				}
				foreach (ReportDataSet.DeviceRow item2 in reportDataSet2.Device)
				{
					stringBuilder.AppendLine($"Device\t{item2.MAC}\t{item2.Name}\t{item2.GID}\t{item2.FIDed}\t");
				}
				foreach (ReportDataSet.LogRow item3 in reportDataSet2.Log)
				{
					stringBuilder.AppendLine(string.Format("Log\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t{9}\t{10}\t{11}\t{12}\t{13}\t", item3.MAC, item3.FID, item3.DateTime.ToString("yyyy.MM.dd HH:mm:ss"), item3.SID, item3.Salesman, item3.DisRound, item3.Sfee, item3.Payment_Card, item3.Payment_Other_1, item3.Payment_Other_2, item3.Payment_Other_3, item3.Payment_Total, item3.Tax, item3.Cost));
				}
				foreach (ReportDataSet.LogItemRow item4 in reportDataSet2.LogItem)
				{
					stringBuilder.AppendLine($"LogItem\t{item4.MAC}\t{item4.FID}\t{item4.SubID}\t{item4.Price}\t{item4.PLU}\t{item4.Class}\t{item4.Dept}\t{item4.Cost}\t{item4.Amount}\t{item4.Unit}\t{item4.Type}\t{item4.Tax}\t{item4.Text1}\t{item4.Text2}\t{item4.Text3}\t{item4.Text4}\t{item4.UnitPrice}\t{item4.CoFID}\t{item4.PLUName}\t");
				}
				foreach (ReportDataSet.StockRow item5 in reportDataSet2.Stock)
				{
					stringBuilder.AppendLine(string.Format("Stock\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t{9}\t{10}\t{11}\t{12}\t{13}\t{14}\t{15}\t{16}\t{17}\t", item5.GID, item5.PLU, item5.STakingTime.ToString("yyyy.MM.dd HH:mm:ss"), item5.Amount, item5.Unit, item5.In_Amount, item5.Spoilage, item5.AmountSP, item5.UnitSP, item5.In_AmountSP, item5.SpoilageSP, item5.In_Money, item5.Sped, item5.SafetyStock, item5.LowStock, item5.Order, item5.KID, item5.KID_Time.ToString("yyyy.MM.dd HH:mm:ss")));
				}
				foreach (ReportDataSet.StockItemRow item6 in reportDataSet2.StockItem)
				{
					stringBuilder.AppendLine(string.Format("StockItem\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t{9}\t{10}\t", item6.KID, item6.GID, item6.MAC, item6.FID, item6.DateTime.ToString("yyyy.MM.dd HH:mm:ss"), item6.Price, item6.PLU, item6.Amount, item6.Unit, item6.Type, item6.UnitPrice));
				}
			}
			byte[] bytes2 = Encoding.UTF8.GetBytes(stringBuilder.ToString());
			RijndaelManaged rijndaelManaged2 = new RijndaelManaged();
			rijndaelManaged2.Key = Program.SecurityCode;
			rijndaelManaged2.Mode = CipherMode.ECB;
			rijndaelManaged2.Padding = PaddingMode.PKCS7;
			ICryptoTransform cryptoTransform2 = rijndaelManaged2.CreateEncryptor();
			byte[] bytes3 = cryptoTransform2.TransformFinalBlock(bytes2, 0, bytes2.Length);
			string directoryName = Path.GetDirectoryName(mf_quit_p1);
			if (!Directory.Exists(directoryName))
			{
				Directory.CreateDirectory(directoryName);
			}
			File.WriteAllBytes(mf_quit_p1, bytes3);
			Application.Restart();
			break;
		}
		case MF_QUIT_FUC.RestoreReport:
		{
			byte[] array = File.ReadAllBytes(mf_quit_p1);
			RijndaelManaged rijndaelManaged = new RijndaelManaged();
			rijndaelManaged.Key = Program.SecurityCode;
			rijndaelManaged.Mode = CipherMode.ECB;
			rijndaelManaged.Padding = PaddingMode.PKCS7;
			ICryptoTransform cryptoTransform = rijndaelManaged.CreateDecryptor();
			byte[] bytes = cryptoTransform.TransformFinalBlock(array, 0, array.Length);
			string[] array2 = Encoding.UTF8.GetString(bytes).Split(new string[1] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries);
			if (array2[0] == "TM-xA Report Backup")
			{
				string text = Application.StartupPath + "\\";
				DateTime now = DateTime.Now;
				string sourceFileName = text + "Report.mdb";
				string destFileName = text + "Report_" + now.ToString("yyMMddHHmmss") + ".mdb";
				File.Copy(sourceFileName, destFileName, overwrite: true);
				stockItemTableAdapter.DeleteAll();
				stockTableAdapter.DeleteAll();
				logItemTableAdapter.DeleteAll();
				logTableAdapter.DeleteAll();
				deviceTableAdapter.DeleteAll();
				sGroupTableAdapter.DeleteAll();
				using ReportDataSet reportDataSet = new ReportDataSet();
				for (int i = 1; i < array2.Length; i++)
				{
					string[] array3 = array2[i].Split('\t');
					switch (array3[0])
					{
					case "sGroup":
						if (array3.Length > 2)
						{
							ReportDataSet.SGroupRow sGroupRow = reportDataSet.SGroup.NewSGroupRow();
							try
							{
								sGroupRow.GID = Program.ParseInt(array3[1]);
								sGroupRow.Name = array3[2];
							}
							catch (IndexOutOfRangeException)
							{
							}
							reportDataSet.SGroup.AddSGroupRow(sGroupRow);
						}
						break;
					case "Device":
						if (array3.Length > 4)
						{
							ReportDataSet.DeviceRow deviceRow = reportDataSet.Device.NewDeviceRow();
							try
							{
								deviceRow.MAC = array3[1];
								deviceRow.Name = array3[2];
								deviceRow.GID = Program.ParseInt(array3[3]);
								deviceRow.FIDed = Program.ParseInt(array3[4]);
							}
							catch (IndexOutOfRangeException)
							{
							}
							reportDataSet.Device.AddDeviceRow(deviceRow);
						}
						break;
					case "Log":
						if (array3.Length > 6)
						{
							ReportDataSet.LogRow logRow = reportDataSet.Log.NewLogRow();
							try
							{
								logRow.MAC = array3[1];
								logRow.FID = Program.ParseInt(array3[2]);
								logRow.DateTime = Program.ParseDateTime(array3[3]);
								logRow.SID = Program.ParseInt(array3[4]);
								logRow.Salesman = Program.ParseInt(array3[5]);
								logRow.DisRound = Program.ParseNormalDecimal(array3[6]);
								logRow.Sfee = Program.ParseNormalDecimal(array3[7]);
								logRow.Payment_Card = Program.ParseNormalDecimal(array3[8]);
								logRow.Payment_Other_1 = Program.ParseNormalDecimal(array3[9]);
								logRow.Payment_Other_2 = Program.ParseNormalDecimal(array3[10]);
								logRow.Payment_Other_3 = Program.ParseNormalDecimal(array3[11]);
								logRow.Payment_Total = Program.ParseNormalDecimal(array3[12]);
								logRow.Tax = Program.ParseNormalDecimal(array3[13]);
								logRow.Cost = Program.ParseNormalDecimal(array3[14]);
							}
							catch (IndexOutOfRangeException)
							{
							}
							reportDataSet.Log.AddLogRow(logRow);
						}
						break;
					case "LogItem":
						if (array3.Length > 19)
						{
							ReportDataSet.LogItemRow logItemRow = reportDataSet.LogItem.NewLogItemRow();
							try
							{
								logItemRow.MAC = array3[1];
								logItemRow.FID = Program.ParseInt(array3[2]);
								logItemRow.SubID = Program.ParseInt(array3[3]);
								logItemRow.Price = Program.ParseNormalDecimal(array3[4]);
								logItemRow.PLU = Program.ParseInt(array3[5]);
								logItemRow.Class = Program.ParseInt(array3[6]);
								logItemRow.Dept = Program.ParseInt(array3[7]);
								logItemRow.Cost = Program.ParseNormalDecimal(array3[8]);
								logItemRow.Amount = Program.ParseNormalDecimal(array3[9]);
								logItemRow.Unit = Program.ParseInt(array3[10]);
								logItemRow.Type = Program.ParseInt(array3[11]);
								logItemRow.Tax = Program.ParseNormalDecimal(array3[12]);
								logItemRow.Text1 = array3[13];
								logItemRow.Text2 = array3[14];
								logItemRow.Text3 = array3[15];
								logItemRow.Text4 = array3[16];
								logItemRow.UnitPrice = Program.ParseNormalDecimal(array3[17]);
								logItemRow.CoFID = Program.ParseInt(array3[18]);
								logItemRow.PLUName = Program.ParseString(array3[19]);
							}
							catch (IndexOutOfRangeException)
							{
							}
							reportDataSet.LogItem.AddLogItemRow(logItemRow);
						}
						break;
					case "Stock":
						if (array3.Length > 18)
						{
							ReportDataSet.StockRow stockRow = reportDataSet.Stock.NewStockRow();
							try
							{
								stockRow.GID = Program.ParseInt(array3[1]);
								stockRow.PLU = Program.ParseInt(array3[2]);
								stockRow.STakingTime = Program.ParseDateTime(array3[3]);
								stockRow.Amount = Program.ParseNormalDecimal(array3[4]);
								stockRow.Unit = Program.ParseInt(array3[5]);
								stockRow.In_Amount = Program.ParseNormalDecimal(array3[6]);
								stockRow.Spoilage = Program.ParseNormalDecimal(array3[7]);
								stockRow.AmountSP = Program.ParseNormalDecimal(array3[8]);
								stockRow.UnitSP = Program.ParseInt(array3[9]);
								stockRow.In_AmountSP = Program.ParseNormalDecimal(array3[10]);
								stockRow.SpoilageSP = Program.ParseNormalDecimal(array3[11]);
								stockRow.In_Money = Program.ParseNormalDecimal(array3[12]);
								stockRow.Sped = Program.ParseBool(array3[13]);
								stockRow.SafetyStock = Program.ParseNormalDecimal(array3[14]);
								stockRow.LowStock = Program.ParseBool(array3[15]);
								stockRow.Order = Program.ParseNormalDecimal(array3[16]);
								stockRow.KID = Program.ParseInt(array3[17]);
								stockRow.KID_Time = Program.ParseDateTime(array3[18]);
							}
							catch (IndexOutOfRangeException)
							{
							}
							reportDataSet.Stock.AddStockRow(stockRow);
						}
						break;
					case "StockItem":
						if (array3.Length > 11)
						{
							ReportDataSet.StockItemRow stockItemRow = reportDataSet.StockItem.NewStockItemRow();
							try
							{
								stockItemRow.KID = Program.ParseInt(array3[1]);
								stockItemRow.GID = Program.ParseInt(array3[2]);
								stockItemRow.MAC = array3[3];
								stockItemRow.FID = Program.ParseInt(array3[4]);
								stockItemRow.DateTime = Program.ParseDateTime(array3[5]);
								stockItemRow.Price = Program.ParseNormalDecimal(array3[6]);
								stockItemRow.PLU = Program.ParseInt(array3[7]);
								stockItemRow.Amount = Program.ParseNormalDecimal(array3[8]);
								stockItemRow.Unit = Program.ParseInt(array3[9]);
								stockItemRow.Type = Program.ParseInt(array3[10]);
								stockItemRow.UnitPrice = Program.ParseNormalDecimal(array3[11]);
							}
							catch (IndexOutOfRangeException)
							{
							}
							reportDataSet.StockItem.AddStockItemRow(stockItemRow);
						}
						break;
					}
				}
				stockItemTableAdapter.Update(reportDataSet.StockItem);
				stockTableAdapter.Update(reportDataSet.Stock);
				logItemTableAdapter.Update(reportDataSet.LogItem);
				logTableAdapter.Update(reportDataSet.Log);
				deviceTableAdapter.Update(reportDataSet.Device);
				sGroupTableAdapter.Update(reportDataSet.SGroup);
			}
			Application.Restart();
			break;
		}
		}
	}

	private void resetReportStripMenuItem_Click(object sender, EventArgs e)
	{
		if (MessageBox.Show(this, Program.GetLang("pw_ResetReport_Warnning"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) == DialogResult.Yes)
		{
			noTrayIcon = true;
			mf_quit_fuc = MF_QUIT_FUC.ResetReport;
			Close();
		}
	}

	private void oBackupReportToolStripMenuItem_Click(object sender, EventArgs e)
	{
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.OverwritePrompt = true;
		saveFileDialog.Filter = "(*.tmbck)|*.tmbck";
		if (saveFileDialog.ShowDialog(this) == DialogResult.OK)
		{
			noTrayIcon = true;
			mf_quit_fuc = MF_QUIT_FUC.BackupReport;
			mf_quit_p1 = saveFileDialog.FileName;
			Close();
		}
	}

	private void oRestoreReportToolStripMenuItem_Click(object sender, EventArgs e)
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.CheckFileExists = true;
		openFileDialog.Filter = "(*.tmbck)|*.tmbck";
		if (openFileDialog.ShowDialog(this) == DialogResult.OK && MessageBox.Show(this, Program.GetLang("pw_RestoreReport_Warnning"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) == DialogResult.Yes)
		{
			noTrayIcon = true;
			mf_quit_fuc = MF_QUIT_FUC.RestoreReport;
			mf_quit_p1 = openFileDialog.FileName;
			Close();
		}
	}

	public void DataSet_Update_Report_Delay(int spv)
	{
		reportDelayTimer_Count = spv;
	}

	private void refreshDelay_Timer_Tick(object sender, EventArgs e)
	{
		if (reportDelayTimer_Count > 0)
		{
			reportDelayTimer_Count--;
			if (reportDelayTimer_Count == 0 && m_reportForm != null && !m_reportForm.IsDisposed)
			{
				m_reportForm.DataSet_Refresh("Report");
			}
		}
	}

	private void MainForm_Activated(object sender, EventArgs e)
	{
		mf_focused = true;
	}

	private void MainForm_Deactivate(object sender, EventArgs e)
	{
		mf_focused = false;
		DeAct_Time = DateTime.Now;
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		this.components = new System.ComponentModel.Container();
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.MainForm));
		this.menuStrip = new System.Windows.Forms.MenuStrip();
		this.fileToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.importToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.importFromFileToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.importFromExcelToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.importFormNetToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.importFromTXTToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.importFromReportToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.wizardToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.managerToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.passwordToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.langToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripSeparator4 = new System.Windows.Forms.ToolStripSeparator();
		this.menuparaToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.promptDirtyToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.exitToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.tmSetToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.specToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.stringToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.faceToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.dtSetToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.deptToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.classToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.pluToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.oOtherToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.oCoBoxPcsToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.oCoProMatToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.labelToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.unitToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.barcodeToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripSeparator3 = new System.Windows.Forms.ToolStripSeparator();
		this.salesmanToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.vipToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripSeparator9 = new System.Windows.Forms.ToolStripSeparator();
		this.bitmapToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripSeparator5 = new System.Windows.Forms.ToolStripSeparator();
		this.toolToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.fontBuilderToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.designerToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.flagToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.oReportToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.oBackupReportToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.oRestoreReportToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.oResetReportToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.oStartupConfigToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.windowToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.hideAllToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripSeparator6 = new System.Windows.Forms.ToolStripSeparator();
		this.cascadeToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.arrangeToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.horizonalToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.verticalToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.closeAllToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.helpToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.chmToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.aboutToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.notifyIcon = new System.Windows.Forms.NotifyIcon(this.components);
		this.icon_ContextMenuStrip = new System.Windows.Forms.ContextMenuStrip(this.components);
		this.rShowTipsToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripSeparator7 = new System.Windows.Forms.ToolStripSeparator();
		this.rOpenMainPanelToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripSeparator8 = new System.Windows.Forms.ToolStripSeparator();
		this.rExitToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.sGroupTableAdapter = new ECS.ReportDataSetTableAdapters.SGroupTableAdapter();
		this.stockItemTableAdapter = new ECS.ReportDataSetTableAdapters.StockItemTableAdapter();
		this.stockTableAdapter = new ECS.ReportDataSetTableAdapters.StockTableAdapter();
		this.logTableAdapter = new ECS.ReportDataSetTableAdapters.LogTableAdapter();
		this.logItemTableAdapter = new ECS.ReportDataSetTableAdapters.LogItemTableAdapter();
		this.deviceTableAdapter = new ECS.ReportDataSetTableAdapters.DeviceTableAdapter();
		this.refreshDelay_Timer = new System.Windows.Forms.Timer(this.components);
		this.faceListTableAdapter = new ECS.ECSDataSetTableAdapters.FaceListTableAdapter();
		this.faceTableAdapter = new ECS.ECSDataSetTableAdapters.FaceTableAdapter();
		this.eCSDataSet = new ECS.ECSDataSet();
		this.menuStrip.SuspendLayout();
		this.icon_ContextMenuStrip.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		base.SuspendLayout();
		this.menuStrip.Items.AddRange(new System.Windows.Forms.ToolStripItem[6] { this.fileToolStripMenuItem, this.tmSetToolStripMenuItem, this.dtSetToolStripMenuItem, this.toolToolStripMenuItem, this.windowToolStripMenuItem, this.helpToolStripMenuItem });
		resources.ApplyResources(this.menuStrip, "menuStrip");
		this.menuStrip.Name = "menuStrip";
		this.menuStrip.RenderMode = System.Windows.Forms.ToolStripRenderMode.Professional;
		this.fileToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[10] { this.importToolStripMenuItem, this.wizardToolStripMenuItem, this.toolStripSeparator1, this.managerToolStripMenuItem, this.passwordToolStripMenuItem, this.langToolStripMenuItem, this.toolStripSeparator4, this.menuparaToolStripMenuItem, this.promptDirtyToolStripMenuItem, this.exitToolStripMenuItem });
		this.fileToolStripMenuItem.Name = "fileToolStripMenuItem";
		resources.ApplyResources(this.fileToolStripMenuItem, "fileToolStripMenuItem");
		this.importToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[5] { this.importFromFileToolStripMenuItem, this.importFromExcelToolStripMenuItem, this.importFormNetToolStripMenuItem, this.importFromTXTToolStripMenuItem, this.importFromReportToolStripMenuItem });
		this.importToolStripMenuItem.Name = "importToolStripMenuItem";
		resources.ApplyResources(this.importToolStripMenuItem, "importToolStripMenuItem");
		this.importFromFileToolStripMenuItem.Name = "importFromFileToolStripMenuItem";
		resources.ApplyResources(this.importFromFileToolStripMenuItem, "importFromFileToolStripMenuItem");
		this.importFromFileToolStripMenuItem.Click += new System.EventHandler(importFromFileToolStripMenuItem_Click);
		this.importFromExcelToolStripMenuItem.Name = "importFromExcelToolStripMenuItem";
		resources.ApplyResources(this.importFromExcelToolStripMenuItem, "importFromExcelToolStripMenuItem");
		this.importFromExcelToolStripMenuItem.Click += new System.EventHandler(importFromExcelToolStripMenuItem_Click);
		this.importFormNetToolStripMenuItem.Name = "importFormNetToolStripMenuItem";
		resources.ApplyResources(this.importFormNetToolStripMenuItem, "importFormNetToolStripMenuItem");
		this.importFormNetToolStripMenuItem.Click += new System.EventHandler(importFormNetToolStripMenuItem_Click);
		this.importFromTXTToolStripMenuItem.Name = "importFromTXTToolStripMenuItem";
		resources.ApplyResources(this.importFromTXTToolStripMenuItem, "importFromTXTToolStripMenuItem");
		this.importFromTXTToolStripMenuItem.Click += new System.EventHandler(importFromTXTToolStripMenuItem_Click);
		this.importFromReportToolStripMenuItem.Name = "importFromReportToolStripMenuItem";
		resources.ApplyResources(this.importFromReportToolStripMenuItem, "importFromReportToolStripMenuItem");
		this.importFromReportToolStripMenuItem.Click += new System.EventHandler(importFromReportToolStripMenuItem_Click);
		this.wizardToolStripMenuItem.Name = "wizardToolStripMenuItem";
		resources.ApplyResources(this.wizardToolStripMenuItem, "wizardToolStripMenuItem");
		this.wizardToolStripMenuItem.Click += new System.EventHandler(wizardToolStripMenuItem_Click);
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		this.managerToolStripMenuItem.Name = "managerToolStripMenuItem";
		resources.ApplyResources(this.managerToolStripMenuItem, "managerToolStripMenuItem");
		this.managerToolStripMenuItem.Click += new System.EventHandler(managerToolStripMenuItem_Click);
		this.passwordToolStripMenuItem.Name = "passwordToolStripMenuItem";
		resources.ApplyResources(this.passwordToolStripMenuItem, "passwordToolStripMenuItem");
		this.passwordToolStripMenuItem.Click += new System.EventHandler(passwordToolStripMenuItem_Click);
		this.langToolStripMenuItem.Name = "langToolStripMenuItem";
		resources.ApplyResources(this.langToolStripMenuItem, "langToolStripMenuItem");
		this.langToolStripMenuItem.Click += new System.EventHandler(langToolStripMenuItem_Click);
		this.toolStripSeparator4.Name = "toolStripSeparator4";
		resources.ApplyResources(this.toolStripSeparator4, "toolStripSeparator4");
		this.menuparaToolStripMenuItem.Name = "menuparaToolStripMenuItem";
		resources.ApplyResources(this.menuparaToolStripMenuItem, "menuparaToolStripMenuItem");
		this.menuparaToolStripMenuItem.Click += new System.EventHandler(menuparaToolStripMenuItem_Click);
		this.promptDirtyToolStripMenuItem.Name = "promptDirtyToolStripMenuItem";
		resources.ApplyResources(this.promptDirtyToolStripMenuItem, "promptDirtyToolStripMenuItem");
		this.promptDirtyToolStripMenuItem.Click += new System.EventHandler(promptDirtyToolStripMenuItem_Click);
		this.exitToolStripMenuItem.Name = "exitToolStripMenuItem";
		resources.ApplyResources(this.exitToolStripMenuItem, "exitToolStripMenuItem");
		this.exitToolStripMenuItem.Click += new System.EventHandler(exitToolStripMenuItem_Click);
		this.tmSetToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[3] { this.specToolStripMenuItem, this.stringToolStripMenuItem, this.faceToolStripMenuItem });
		this.tmSetToolStripMenuItem.Name = "tmSetToolStripMenuItem";
		resources.ApplyResources(this.tmSetToolStripMenuItem, "tmSetToolStripMenuItem");
		this.specToolStripMenuItem.Name = "specToolStripMenuItem";
		resources.ApplyResources(this.specToolStripMenuItem, "specToolStripMenuItem");
		this.specToolStripMenuItem.Click += new System.EventHandler(specToolStripMenuItem_Click);
		this.stringToolStripMenuItem.Name = "stringToolStripMenuItem";
		resources.ApplyResources(this.stringToolStripMenuItem, "stringToolStripMenuItem");
		this.stringToolStripMenuItem.Click += new System.EventHandler(stringToolStripMenuItem_Click);
		this.faceToolStripMenuItem.Name = "faceToolStripMenuItem";
		resources.ApplyResources(this.faceToolStripMenuItem, "faceToolStripMenuItem");
		this.faceToolStripMenuItem.Click += new System.EventHandler(faceToolStripMenuItem_Click);
		this.dtSetToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[14]
		{
			this.deptToolStripMenuItem, this.classToolStripMenuItem, this.pluToolStripMenuItem, this.oOtherToolStripMenuItem, this.toolStripSeparator2, this.labelToolStripMenuItem, this.unitToolStripMenuItem, this.barcodeToolStripMenuItem, this.toolStripSeparator3, this.salesmanToolStripMenuItem,
			this.vipToolStripMenuItem, this.toolStripSeparator9, this.bitmapToolStripMenuItem, this.toolStripSeparator5
		});
		this.dtSetToolStripMenuItem.Name = "dtSetToolStripMenuItem";
		resources.ApplyResources(this.dtSetToolStripMenuItem, "dtSetToolStripMenuItem");
		this.deptToolStripMenuItem.Name = "deptToolStripMenuItem";
		resources.ApplyResources(this.deptToolStripMenuItem, "deptToolStripMenuItem");
		this.deptToolStripMenuItem.Click += new System.EventHandler(deptToolStripMenuItem_Click);
		this.classToolStripMenuItem.Name = "classToolStripMenuItem";
		resources.ApplyResources(this.classToolStripMenuItem, "classToolStripMenuItem");
		this.classToolStripMenuItem.Click += new System.EventHandler(classToolStripMenuItem_Click);
		this.pluToolStripMenuItem.Name = "pluToolStripMenuItem";
		resources.ApplyResources(this.pluToolStripMenuItem, "pluToolStripMenuItem");
		this.pluToolStripMenuItem.Click += new System.EventHandler(pluToolStripMenuItem_Click);
		this.oOtherToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[2] { this.oCoBoxPcsToolStripMenuItem, this.oCoProMatToolStripMenuItem });
		this.oOtherToolStripMenuItem.Name = "oOtherToolStripMenuItem";
		resources.ApplyResources(this.oOtherToolStripMenuItem, "oOtherToolStripMenuItem");
		this.oCoBoxPcsToolStripMenuItem.Name = "oCoBoxPcsToolStripMenuItem";
		resources.ApplyResources(this.oCoBoxPcsToolStripMenuItem, "oCoBoxPcsToolStripMenuItem");
		this.oCoBoxPcsToolStripMenuItem.Click += new System.EventHandler(oCoBoxPcsToolStripMenuItem_Click);
		this.oCoProMatToolStripMenuItem.Name = "oCoProMatToolStripMenuItem";
		resources.ApplyResources(this.oCoProMatToolStripMenuItem, "oCoProMatToolStripMenuItem");
		this.oCoProMatToolStripMenuItem.Click += new System.EventHandler(oCoProMatToolStripMenuItem_Click);
		this.toolStripSeparator2.Name = "toolStripSeparator2";
		resources.ApplyResources(this.toolStripSeparator2, "toolStripSeparator2");
		this.labelToolStripMenuItem.Name = "labelToolStripMenuItem";
		resources.ApplyResources(this.labelToolStripMenuItem, "labelToolStripMenuItem");
		this.labelToolStripMenuItem.Click += new System.EventHandler(labelToolStripMenuItem_Click);
		this.unitToolStripMenuItem.Name = "unitToolStripMenuItem";
		resources.ApplyResources(this.unitToolStripMenuItem, "unitToolStripMenuItem");
		this.unitToolStripMenuItem.Click += new System.EventHandler(unitToolStripMenuItem_Click);
		this.barcodeToolStripMenuItem.Name = "barcodeToolStripMenuItem";
		resources.ApplyResources(this.barcodeToolStripMenuItem, "barcodeToolStripMenuItem");
		this.barcodeToolStripMenuItem.Click += new System.EventHandler(barcodeToolStripMenuItem_Click);
		this.toolStripSeparator3.Name = "toolStripSeparator3";
		resources.ApplyResources(this.toolStripSeparator3, "toolStripSeparator3");
		this.salesmanToolStripMenuItem.Name = "salesmanToolStripMenuItem";
		resources.ApplyResources(this.salesmanToolStripMenuItem, "salesmanToolStripMenuItem");
		this.salesmanToolStripMenuItem.Click += new System.EventHandler(salesmanToolStripMenuItem_Click);
		this.vipToolStripMenuItem.Name = "vipToolStripMenuItem";
		resources.ApplyResources(this.vipToolStripMenuItem, "vipToolStripMenuItem");
		this.vipToolStripMenuItem.Click += new System.EventHandler(vipToolStripMenuItem_Click);
		this.toolStripSeparator9.Name = "toolStripSeparator9";
		resources.ApplyResources(this.toolStripSeparator9, "toolStripSeparator9");
		this.bitmapToolStripMenuItem.Name = "bitmapToolStripMenuItem";
		resources.ApplyResources(this.bitmapToolStripMenuItem, "bitmapToolStripMenuItem");
		this.bitmapToolStripMenuItem.Click += new System.EventHandler(bitmapToolStripMenuItem_Click);
		this.toolStripSeparator5.Name = "toolStripSeparator5";
		resources.ApplyResources(this.toolStripSeparator5, "toolStripSeparator5");
		this.toolToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[5] { this.fontBuilderToolStripMenuItem, this.designerToolStripMenuItem, this.flagToolStripMenuItem, this.oReportToolStripMenuItem, this.oStartupConfigToolStripMenuItem });
		this.toolToolStripMenuItem.Name = "toolToolStripMenuItem";
		resources.ApplyResources(this.toolToolStripMenuItem, "toolToolStripMenuItem");
		this.fontBuilderToolStripMenuItem.Name = "fontBuilderToolStripMenuItem";
		resources.ApplyResources(this.fontBuilderToolStripMenuItem, "fontBuilderToolStripMenuItem");
		this.fontBuilderToolStripMenuItem.Click += new System.EventHandler(fontBuilderToolStripMenuItem_Click);
		this.designerToolStripMenuItem.Name = "designerToolStripMenuItem";
		resources.ApplyResources(this.designerToolStripMenuItem, "designerToolStripMenuItem");
		this.designerToolStripMenuItem.Click += new System.EventHandler(designerToolStripMenuItem_Click);
		this.flagToolStripMenuItem.Name = "flagToolStripMenuItem";
		resources.ApplyResources(this.flagToolStripMenuItem, "flagToolStripMenuItem");
		this.flagToolStripMenuItem.Click += new System.EventHandler(flagToolStripMenuItem_Click);
		this.oReportToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[3] { this.oBackupReportToolStripMenuItem, this.oRestoreReportToolStripMenuItem, this.oResetReportToolStripMenuItem });
		this.oReportToolStripMenuItem.Name = "oReportToolStripMenuItem";
		resources.ApplyResources(this.oReportToolStripMenuItem, "oReportToolStripMenuItem");
		this.oBackupReportToolStripMenuItem.Name = "oBackupReportToolStripMenuItem";
		resources.ApplyResources(this.oBackupReportToolStripMenuItem, "oBackupReportToolStripMenuItem");
		this.oBackupReportToolStripMenuItem.Click += new System.EventHandler(oBackupReportToolStripMenuItem_Click);
		this.oRestoreReportToolStripMenuItem.Name = "oRestoreReportToolStripMenuItem";
		resources.ApplyResources(this.oRestoreReportToolStripMenuItem, "oRestoreReportToolStripMenuItem");
		this.oRestoreReportToolStripMenuItem.Click += new System.EventHandler(oRestoreReportToolStripMenuItem_Click);
		this.oResetReportToolStripMenuItem.Name = "oResetReportToolStripMenuItem";
		resources.ApplyResources(this.oResetReportToolStripMenuItem, "oResetReportToolStripMenuItem");
		this.oResetReportToolStripMenuItem.Click += new System.EventHandler(resetReportStripMenuItem_Click);
		this.oStartupConfigToolStripMenuItem.Name = "oStartupConfigToolStripMenuItem";
		resources.ApplyResources(this.oStartupConfigToolStripMenuItem, "oStartupConfigToolStripMenuItem");
		this.oStartupConfigToolStripMenuItem.Click += new System.EventHandler(oStartupConfigToolStripMenuItem_Click);
		this.windowToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[7] { this.hideAllToolStripMenuItem, this.toolStripSeparator6, this.cascadeToolStripMenuItem, this.arrangeToolStripMenuItem, this.horizonalToolStripMenuItem, this.verticalToolStripMenuItem, this.closeAllToolStripMenuItem });
		this.windowToolStripMenuItem.Name = "windowToolStripMenuItem";
		resources.ApplyResources(this.windowToolStripMenuItem, "windowToolStripMenuItem");
		this.hideAllToolStripMenuItem.Name = "hideAllToolStripMenuItem";
		resources.ApplyResources(this.hideAllToolStripMenuItem, "hideAllToolStripMenuItem");
		this.hideAllToolStripMenuItem.Click += new System.EventHandler(hideAllToolStripMenuItem_Click);
		this.toolStripSeparator6.Name = "toolStripSeparator6";
		resources.ApplyResources(this.toolStripSeparator6, "toolStripSeparator6");
		this.cascadeToolStripMenuItem.Name = "cascadeToolStripMenuItem";
		resources.ApplyResources(this.cascadeToolStripMenuItem, "cascadeToolStripMenuItem");
		this.cascadeToolStripMenuItem.Click += new System.EventHandler(cascadeToolStripMenuItem_Click);
		this.arrangeToolStripMenuItem.Name = "arrangeToolStripMenuItem";
		resources.ApplyResources(this.arrangeToolStripMenuItem, "arrangeToolStripMenuItem");
		this.arrangeToolStripMenuItem.Click += new System.EventHandler(arrangToolStripMenuItem_Click);
		this.horizonalToolStripMenuItem.Name = "horizonalToolStripMenuItem";
		resources.ApplyResources(this.horizonalToolStripMenuItem, "horizonalToolStripMenuItem");
		this.horizonalToolStripMenuItem.Click += new System.EventHandler(horizonalToolStripMenuItem_Click);
		this.verticalToolStripMenuItem.Name = "verticalToolStripMenuItem";
		resources.ApplyResources(this.verticalToolStripMenuItem, "verticalToolStripMenuItem");
		this.verticalToolStripMenuItem.Click += new System.EventHandler(verticalToolStripMenuItem_Click);
		this.closeAllToolStripMenuItem.Name = "closeAllToolStripMenuItem";
		resources.ApplyResources(this.closeAllToolStripMenuItem, "closeAllToolStripMenuItem");
		this.closeAllToolStripMenuItem.Click += new System.EventHandler(closeAllToolStripMenuItem_Click);
		this.helpToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[2] { this.chmToolStripMenuItem, this.aboutToolStripMenuItem });
		this.helpToolStripMenuItem.Name = "helpToolStripMenuItem";
		resources.ApplyResources(this.helpToolStripMenuItem, "helpToolStripMenuItem");
		this.chmToolStripMenuItem.Name = "chmToolStripMenuItem";
		resources.ApplyResources(this.chmToolStripMenuItem, "chmToolStripMenuItem");
		this.chmToolStripMenuItem.Click += new System.EventHandler(chmToolStripMenuItem_Click);
		this.aboutToolStripMenuItem.Name = "aboutToolStripMenuItem";
		resources.ApplyResources(this.aboutToolStripMenuItem, "aboutToolStripMenuItem");
		this.aboutToolStripMenuItem.Click += new System.EventHandler(aboutToolStripMenuItem_Click);
		this.notifyIcon.ContextMenuStrip = this.icon_ContextMenuStrip;
		resources.ApplyResources(this.notifyIcon, "notifyIcon");
		this.notifyIcon.MouseClick += new System.Windows.Forms.MouseEventHandler(notifyIcon_MouseClick);
		this.icon_ContextMenuStrip.Items.AddRange(new System.Windows.Forms.ToolStripItem[5] { this.rShowTipsToolStripMenuItem, this.toolStripSeparator7, this.rOpenMainPanelToolStripMenuItem, this.toolStripSeparator8, this.rExitToolStripMenuItem });
		this.icon_ContextMenuStrip.Name = "icon_ContextMenuStrip";
		resources.ApplyResources(this.icon_ContextMenuStrip, "icon_ContextMenuStrip");
		this.rShowTipsToolStripMenuItem.Name = "rShowTipsToolStripMenuItem";
		resources.ApplyResources(this.rShowTipsToolStripMenuItem, "rShowTipsToolStripMenuItem");
		this.rShowTipsToolStripMenuItem.Click += new System.EventHandler(rShowTipsToolStripMenuItem_Click);
		this.toolStripSeparator7.Name = "toolStripSeparator7";
		resources.ApplyResources(this.toolStripSeparator7, "toolStripSeparator7");
		this.rOpenMainPanelToolStripMenuItem.Name = "rOpenMainPanelToolStripMenuItem";
		resources.ApplyResources(this.rOpenMainPanelToolStripMenuItem, "rOpenMainPanelToolStripMenuItem");
		this.rOpenMainPanelToolStripMenuItem.Click += new System.EventHandler(rOpenMainPanelToolStripMenuItem_Click);
		this.toolStripSeparator8.Name = "toolStripSeparator8";
		resources.ApplyResources(this.toolStripSeparator8, "toolStripSeparator8");
		this.rExitToolStripMenuItem.Name = "rExitToolStripMenuItem";
		resources.ApplyResources(this.rExitToolStripMenuItem, "rExitToolStripMenuItem");
		this.rExitToolStripMenuItem.Click += new System.EventHandler(rExitToolStripMenuItem_Click);
		this.sGroupTableAdapter.ClearBeforeFill = true;
		this.stockItemTableAdapter.ClearBeforeFill = true;
		this.stockTableAdapter.ClearBeforeFill = true;
		this.logTableAdapter.ClearBeforeFill = true;
		this.logItemTableAdapter.ClearBeforeFill = true;
		this.deviceTableAdapter.ClearBeforeFill = true;
		this.refreshDelay_Timer.Enabled = true;
		this.refreshDelay_Timer.Interval = 1000;
		this.refreshDelay_Timer.Tick += new System.EventHandler(refreshDelay_Timer_Tick);
		this.faceListTableAdapter.ClearBeforeFill = true;
		this.faceTableAdapter.ClearBeforeFill = true;
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.AutoValidate = System.Windows.Forms.AutoValidate.EnableAllowFocusChange;
		resources.ApplyResources(this, "$this");
		base.Controls.Add(this.menuStrip);
		base.IsMdiContainer = true;
		base.MainMenuStrip = this.menuStrip;
		base.Name = "MainForm";
		base.WindowState = System.Windows.Forms.FormWindowState.Maximized;
		base.Activated += new System.EventHandler(MainForm_Activated);
		base.Deactivate += new System.EventHandler(MainForm_Deactivate);
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(MainForm_FormClosing);
		base.Load += new System.EventHandler(MainForm_Load);
		base.Resize += new System.EventHandler(MainForm_Resize);
		this.menuStrip.ResumeLayout(false);
		this.menuStrip.PerformLayout();
		this.icon_ContextMenuStrip.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
