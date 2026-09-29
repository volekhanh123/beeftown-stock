using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.ComponentModel;
using System.Data;
using System.Data.OleDb;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;
using ECS.ReportDataSetTableAdapters;

namespace ECS;

public class NetForm : Form
{
	private enum LinkType
	{
		TcpOffline,
		TcpClient,
		TcpServer,
		UdpClient
	}

	private enum TableType
	{
		Unattached,
		Attached
	}

	private enum NetworkAction
	{
		None,
		UploadInfo,
		DownloadInfo,
		UploadTime,
		DownloadTime,
		UploadECS,
		DownloadECS,
		UploadReport,
		UploadMdb,
		DownloadMdb,
		DownloadIP,
		DownloadMAC
	}

	private delegate bool ask_fuc_Callback(MyTag myTag, string ask);

	private delegate void RemoveLinkAsyCallback(MyTag myTag, bool bNotify);

	private class MyTag
	{
		public TcpClient Client;

		public StreamReader sr;

		public StreamWriter sw;

		public StreamWriter swutf;

		public LinkType LinkType;

		public TableType TableType;

		public BackgroundWorker BW;

		public BackgroundWorker BGW_GetLines;

		public NetworkAction NetworkAction;

		public object[] Args;

		public Encoding Enc;

		public string nVersion = "V1.00";

		public string cVersion;

		public string tVersion;

		public int mem_DATA;

		public int mem_FONT;

		public bool PTOK;

		public bool MinusUpload;

		public string Mac;

		public int P1S2;

		public string CW_Another;

		public string IPP;

		public Queue<string> RxAsk = new Queue<string>();

		public Queue<string> RxDATA = new Queue<string>();

		public bool RxMFucing;

		public bool RxClosing;

		public byte[] AsyBuf;

		public NetForm mform;

		public int OnlineFucNo;

		public void Client_RW(bool startAsy = false)
		{
			if (!PTOK)
			{
				NetworkStream stream = Client.GetStream();
				sr = new StreamReader(stream, Enc);
				sw = new StreamWriter(stream, Enc);
				if (Enc != Encoding.UTF8)
				{
					swutf = new StreamWriter(stream, Encoding.UTF8);
				}
				else
				{
					swutf = null;
				}
				sw.AutoFlush = true;
				sw.WriteLine();
				PTOK = true;
			}
			if (startAsy && mform.gAsk)
			{
				BGW_GetLines = new BackgroundWorker();
				BGW_GetLines.WorkerSupportsCancellation = true;
				BGW_GetLines.DoWork += mform.BGW_GetLines_DoWork;
				Client.ReceiveTimeout = 0;
				BGW_GetLines.RunWorkerAsync(this);
				RxClosing = false;
			}
		}

		public void AsyReadClear()
		{
			if (BGW_GetLines == null)
			{
				sr.DiscardBufferedData();
			}
			else
			{
				RxDATA.Clear();
			}
		}

		public string AsyReadLine()
		{
			if (BGW_GetLines == null)
			{
				string text;
				do
				{
					text = sr.ReadLine();
					if (text == null)
					{
						throw new IOException();
					}
				}
				while ((text.Length >= 4 && text.Substring(0, 4) == "ASK\t") || text.Length <= 0);
				return text;
			}
			int num = mform.recvTimeOut / 100;
			while (num > 0)
			{
				if (RxDATA.Count >= 1)
				{
					return RxDATA.Dequeue();
				}
				num--;
				Thread.Sleep(100);
			}
			RxClosing = true;
			throw new IOException();
		}

		public void AsyStart()
		{
			RxMFucing = false;
		}

		public void AsyEnd()
		{
			RxMFucing = true;
			RxDATA.Clear();
		}

		public MyTag(TcpClient client, LinkType linkType, TableType tableType, NetForm form)
		{
			AsyBuf = new byte[1];
			Client = client;
			LinkType = linkType;
			TableType = tableType;
			MinusUpload = false;
			mform = form;
			BW = new BackgroundWorker();
			BW.WorkerSupportsCancellation = (BW.WorkerReportsProgress = true);
			BW.DoWork += form.BW_DoWork;
			BW.ProgressChanged += form.BW_ProgressChanged;
			BW.RunWorkerCompleted += form.BW_RunWorkerCompleted;
			BGW_GetLines = null;
			NetworkAction = NetworkAction.None;
			Args = null;
			Enc = Program.GetEncoding();
		}
	}

	private delegate void AddLinkCallback(TcpClient client, LinkType type);

	private delegate bool HasItemCallback(IPEndPoint ip);

	private delegate void NetworkActionAllCallback(NetworkAction networkAction);

	private delegate void DataSet_RefreshCallback(string Type);

	private delegate void goClosed_Callback();

	private delegate bool CloseThread_BW_Callback();

	private delegate void UploadReport_Log_Info_Tip_Callback(string Info);

	private delegate void UploadReport_Log_Error_Tip_Callback(string Error);

	private delegate void ecsData_Log_Info_Tip_Callback(string Info);

	private class ListViewColumnSorterWIP : IComparer
	{
		private int ColumnToSort;

		private SortOrder OrderOfSort;

		private CaseInsensitiveComparer ObjectCompare;

		public int SortColumn
		{
			get
			{
				return ColumnToSort;
			}
			set
			{
				ColumnToSort = value;
			}
		}

		public SortOrder Order
		{
			get
			{
				return OrderOfSort;
			}
			set
			{
				OrderOfSort = value;
			}
		}

		public ListViewColumnSorterWIP()
		{
			ColumnToSort = 0;
			OrderOfSort = SortOrder.None;
			ObjectCompare = new CaseInsensitiveComparer();
		}

		public int Compare(object x, object y)
		{
			ListViewItem listViewItem = (ListViewItem)x;
			ListViewItem listViewItem2 = (ListViewItem)y;
			int num;
			if (ColumnToSort != 0)
			{
				num = ObjectCompare.Compare(listViewItem.SubItems[ColumnToSort].Text, listViewItem2.SubItems[ColumnToSort].Text);
			}
			else
			{
				string[] array = listViewItem.SubItems[ColumnToSort].Text.Split(':', '.');
				string[] array2 = listViewItem2.SubItems[ColumnToSort].Text.Split(':', '.');
				int num2 = array.Length;
				if (num2 <= array2.Length)
				{
					num = ((num2 < array2.Length) ? (-1) : 0);
				}
				else
				{
					num2 = array2.Length;
					num = 1;
				}
				for (int i = 0; i < num2; i++)
				{
					int num3 = Program.ParseInt(array[i]);
					int num4 = Program.ParseInt(array2[i]);
					if (num3 > num4)
					{
						num = 1;
						break;
					}
					if (num3 < num4)
					{
						num = -1;
						break;
					}
				}
			}
			if (OrderOfSort == SortOrder.Ascending)
			{
				return num;
			}
			if (OrderOfSort == SortOrder.Descending)
			{
				return -num;
			}
			return 0;
		}
	}

	private delegate void AutoTXT_AutoCallback(int NeedWait);

	private delegate void AutoExcel_AutoCallback(int NeedWait);

	public bool gAsk;

	private int recvTimeOut;

	private int num_onlineDevice;

	private CultureInfo cultureInfo = Thread.CurrentThread.CurrentUICulture;

	private Thread tcpServerThread;

	private Thread udpClientThread;

	private TcpListener tcpListener;

	private UdpClient udpClient;

	private int AskLogs_ExDevice;

	private Thread closeThread;

	private bool closeFinish;

	private bool closing;

	private List<System.Threading.Timer> timers = new List<System.Threading.Timer>();

	private UIDataSet.CustomRow custom1Row;

	private UIDataSet.CustomRow custom2Row;

	private UIDataSet.CustomRow custom3Row;

	private UIDataSet.CustomRow custom4Row;

	private ListViewColumnSorterWIP lvwColumnSorter = new ListViewColumnSorterWIP();

	private string[] UnitTable;

	private int UpdatedFromExcel;

	private bool AutoTXT_Running;

	private FileSystemWatcher watcher_txt;

	private FileSystemWatcher watcher_excel;

	private bool AutoExcel_Running;

	public bool mf_Docked;

	public bool mf_Docking;

	public Panel mf_Docking_Panel;

	public Queue<string> withReportIP = new Queue<string>();

	private IContainer components;

	private ImageList imageList;

	private ECSDataSet ecsDataSet;

	private DeptTableAdapter deptTableAdapter;

	private ClassTableAdapter classTableAdapter;

	private UnitTableAdapter unitTableAdapter;

	private BarcodeTableAdapter barcodeTableAdapter;

	private SalesmanTableAdapter salesmanTableAdapter;

	private LabelTableAdapter labelTableAdapter;

	private LabelItemTableAdapter labelItemTableAdapter;

	private StringTableAdapter stringTableAdapter;

	private FaceTableAdapter faceTableAdapter;

	private SpecTableAdapter specTableAdapter;

	private PLUTableAdapter pLUTableAdapter;

	private WebClient webClient;

	private UIDataSet uiDataSet;

	private Custom1TableAdapter custom1TableAdapter;

	private Custom2TableAdapter custom2TableAdapter;

	private Custom3TableAdapter custom3TableAdapter;

	private Custom4TableAdapter custom4TableAdapter;

	private BindingSource formypeBindingSource;

	private BindingSource pLU_ColBindingSource;

	private BindingSource excelBindingSource;

	private BindingSource plu_ColbindingSource1;

	private ExcelDefaultTableAdapter excelDefaultTableAdapter;

	private BindingSource excelDefaultBindingSource;

	private UnitTableAdapter unitTableAdapter1;

	private ECS.ECSDataSetTableAdapters.ExcelTableAdapter excelTableAdapter;

	private VIPTableAdapter vipTableAdapter;

	private FaceListTableAdapter faceListTableAdapter;

	private DeviceTableAdapter deviceTableAdapter;

	private ToolStripPanel BottomToolStripPanel;

	private ToolStripPanel TopToolStripPanel;

	private ToolStripPanel RightToolStripPanel;

	private ToolStripPanel LeftToolStripPanel;

	private ToolStripContentPanel ContentPanel;

	private SplitContainer splitContainer;

	private ListView listView;

	private ColumnHeader ipColumnHeader;

	private ColumnHeader shopNameColumnHeader;

	private ColumnHeader machineNameColumnHeader;

	private ColumnHeader machineNoColumnHeader;

	private ColumnHeader typeColumnHeader;

	private ColumnHeader tableColumnHeader;

	private ColumnHeader statusColumnHeader;

	private ColumnHeader numlistColumnHeader;

	private ColumnHeader macColumnHeader;

	private TabControl tabControl;

	private TabPage ecsTabPage;

	private ComboBox fontComboBox;

	private CheckBox vipPointCheckBox;

	private CheckBox vipCheckBox;

	private Button tMSbrowseButton;

	private Button upgradebrowseButton;

	private CheckBox tMSCheckBox;

	private CheckBox upgradeCheckBox;

	private TextBox tMSFileBox;

	private TextBox upgradeFileBox;

	private CheckBox custom4CheckBox;

	private CheckBox custom3CheckBox;

	private CheckBox custom2CheckBox;

	private CheckBox custom1CheckBox;

	private RadioButton saveButton;

	private RadioButton openButton;

	private CheckBox bmpCheckBox;

	private CheckBox deptCheckBox;

	private CheckBox fontCheckBox;

	private CheckBox classCheckBox;

	private CheckBox clearCheckBox;

	private Button exeButton;

	private CheckBox wizardCheckBox;

	private CheckBox selAllCheckBox;

	private CheckBox unitCheckBox;

	private CheckBox salesmanCheckBox;

	private CheckBox faceCheckBox;

	private CheckBox barcodeCheckBox;

	private CheckBox stringCheckBox;

	private CheckBox pLUCheckBox;

	private CheckBox specCheckBox;

	private CheckBox labelCheckBox;

	private TabPage reportTabPage;

	private TextBox ReportInfo_TextBox;

	private TextBox ReportError_TextBox;

	private GroupBox Report2_GroupBox;

	private CheckBox reCheckBox;

	private Button repButton;

	private Button repAllButton;

	private GroupBox Report1_GroupBox;

	private Button allDefaultStock_Button;

	private CheckBox TabledAutoReNumber_CheckBox;

	private Button specifyStock_Button;

	private Label nTabledInfo_Label;

	private Label TabledInfo_Label;

	private Label nTabledNumber_Label;

	private Label TabledNumber_Label;

	private Button showButton;

	private TabPage txtPage;

	private CheckBox txtPage_autoclear_checkbox;

	private Button txtPage_systemtray_Button;

	private CheckBox txtPage_clear_checkbox;

	private CheckBox txtPage_update_checkbox;

	private Label formtype;

	private Label txtfile;

	private Button txtbrowseButton;

	private Button txtSelAllbutton;

	private Button txtExebutton;

	private TabPage excelPage;

	private SplitContainer splitContainer1;

	private SplitContainer splitContainer2;

	private DataGridView excelDataGridView;

	private DataGridViewTextBoxColumn idColumn;

	private DataGridViewComboBoxColumn fieldColumn;

	private BindingNavigator bindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem;

	private ToolStripLabel bindingNavigatorCountItem;

	private ToolStripButton bindingNavigatorDeleteItem;

	private ToolStripButton bindingNavigatorMoveFirstItem;

	private ToolStripButton bindingNavigatorMovePreviousItem;

	private ToolStripSeparator bindingNavigatorSeparator;

	private ToolStripTextBox bindingNavigatorPositionItem;

	private ToolStripSeparator bindingNavigatorSeparator1;

	private ToolStripButton bindingNavigatorMoveNextItem;

	private ToolStripButton bindingNavigatorMoveLastItem;

	private ToolStripSeparator bindingNavigatorSeparator2;

	private ToolStripButton clearToolStripButton;

	private DataGridView excelDefaultDataGridView;

	private BindingNavigator bindingNavigator1;

	private ToolStripButton toolStripButton1;

	private ToolStripLabel toolStripLabel1;

	private ToolStripButton toolStripButton2;

	private ToolStripButton toolStripButton3;

	private ToolStripButton toolStripButton4;

	private ToolStripSeparator toolStripSeparator2;

	private ToolStripTextBox toolStripTextBox1;

	private ToolStripSeparator toolStripSeparator4;

	private ToolStripButton toolStripButton5;

	private ToolStripButton toolStripButton6;

	private ToolStripSeparator toolStripSeparator5;

	private ToolStripButton toolStripButton7;

	private Button excelPage_systemtray_Button;

	private CheckBox excelPage_autoclear_checkbox;

	private CheckBox excelPage_auto_checkbox;

	private Button excelbrowseButton;

	private TextBox excelfileTextBox;

	private CheckBox excelPage_clear_checkbox;

	private CheckBox excelPage_update_checkbox;

	private Button excelSelAllbutton;

	private Button excelExebutton;

	private TabPage mdbTabPage;

	private Button MDBsave_Button;

	private ComboBox fileComboBox;

	private Label progressLabel;

	private ProgressBar progressBar;

	private Button cancelButton;

	private Button downloadButton;

	private Button uploadButton;

	private Label label1;

	private Label passowrdLabel;

	private Label usernameLabel;

	private TextBox uriTextBox;

	private TextBox passwordTextBox;

	private CheckBox logCheckBox;

	private TextBox usernameTextBox;

	private ToolStrip toolStrip;

	private ToolStripButton addToolStripButton;

	private ToolStripButton deleteToolStripButton;

	private ToolStripButton findToolStripButton;

	private ToolStripButton shutToolStripButton;

	private ToolStripSeparator toolStripSeparator3;

	private ToolStripButton taskToolStripButton;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripButton selAllToolStripButton;

	private ToolStripButton cancelToolStripButton;

	private ToolStripButton timeToolStripButton;

	private ToolStripButton renameToolStripButton;

	private ToolStripButton ipToolStripButton;

	private ToolStripButton MAC_ToolStripButton;

	private ToolStripButton MACr_ToolStripButton;

	private ToolStrip expandshrink_ToolStrip;

	private ToolStripLabel ethernet_ToolStripLabel;

	private ToolStripButton expand_toolStripButton;

	private ToolStripButton shrink_ToolStripButton;

	private TextBox ecsData_TextBox;

	private Button txtPage_startup_Button;

	private Button excelPage_startup_Button;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private DataGridViewComboBoxColumn dataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn3;

	private System.Windows.Forms.Timer reportTimer;

	private ComboBox faceListComboBox;

	private BindingSource faceListBindingSource;

	private ColumnHeader ip2ColumnHeader;

	private NumericUpDown txtPage_MonitorDelay_NumericUpDown;

	private Label MonitorDelay_E1_Label;

	private Label MonitorDelay_B1_Label;

	private NumericUpDown excelPage_MonitorDelay_NumericUpDown;

	private Label MonitorDelay_E2_Label;

	private Label MonitorDelay_B2_Label;

	private CheckBox txtPage_auto_checkbox;

	private ComboBox formtypeComboBox;

	private TextBox typeTextBox;

	private TextBox txtfileTextBox;

	private int ask_fuc_plu_find(string[] items)
	{
		int num = Program.ParseInt(items[2]);
		if (num != 0 && ecsDataSet.PLU.FindByPLUID(num) != null)
		{
			return num;
		}
		num = Program.ParseInt(items[3]);
		if (num != 0)
		{
			DataRow[] array = ecsDataSet.PLU.Select($"[Remark] = '{num}'");
			if (array.Length >= 1)
			{
				return (int)array[0].ItemArray[0];
			}
		}
		if (items[4].Length != 0)
		{
			DataRow[] array2 = ecsDataSet.PLU.Select($"[Index] = '{items[4]}'");
			if (array2.Length >= 1)
			{
				return (int)array2[0].ItemArray[0];
			}
		}
		return 0;
	}

	private bool ask_fuc(MyTag myTag, string ask)
	{
		if (base.InvokeRequired)
		{
			Invoke(new ask_fuc_Callback(ask_fuc), myTag, ask);
		}
		else
		{
			string[] array = ask.Split('\t');
			if (array.Length >= 2 && array[0] == "ASK")
			{
				if (array[1] == "REP")
				{
					if (gAsk && Settings.Default.gen_AskLogs)
					{
						IPEndPoint iPEndPoint = (IPEndPoint)myTag.Client.Client.RemoteEndPoint;
						if (num_onlineDevice < AskLogs_ExDevice)
						{
							ListViewItem item = listView.FindItemWithText(iPEndPoint.ToString());
							BeginNetworkAction(item, NetworkAction.UploadReport);
						}
						else
						{
							string item2 = iPEndPoint.ToString();
							if (!withReportIP.Contains(item2))
							{
								withReportIP.Enqueue(item2);
							}
						}
						return true;
					}
				}
				else if (array[1] == "PLU" && gAsk && Settings.Default.gen_AskPLU)
				{
					int num = ask_fuc_plu_find(array);
					if (num > 0)
					{
						IPEndPoint iPEndPoint2 = (IPEndPoint)myTag.Client.Client.RemoteEndPoint;
						ListViewItem item3 = listView.FindItemWithText(iPEndPoint2.ToString());
						BeginNetworkAction(item3, NetworkAction.DownloadECS, new object[21]
						{
							false,
							false,
							false,
							false,
							"",
							false,
							false,
							false,
							CheckState.Checked,
							false,
							false,
							false,
							"",
							false,
							false,
							false,
							"",
							"",
							0,
							num,
							false
						});
						return true;
					}
				}
			}
		}
		return false;
	}

	private void RemoveLinkAsy(MyTag myTag, bool bNotify)
	{
		if (base.InvokeRequired)
		{
			Invoke(new RemoveLinkAsyCallback(RemoveLinkAsy), myTag, bNotify);
			return;
		}
		foreach (ListViewItem item in listView.Items)
		{
			if (GetItemTag(item) == myTag)
			{
				RemoveLink(item, bNotify);
				break;
			}
		}
	}

	private void listView_LineNum()
	{
		int num = 0;
		int num2 = 0;
		num_onlineDevice = 0;
		foreach (ListViewItem item in listView.Items)
		{
			item.SubItems[7].Text = (item.Index + 1).ToString();
			MyTag itemTag = GetItemTag(item);
			if (itemTag.TableType == TableType.Attached)
			{
				num++;
			}
			else
			{
				num2++;
			}
			if (itemTag.LinkType != LinkType.TcpOffline)
			{
				num_onlineDevice++;
			}
		}
		TabledNumber_Label.Text = num.ToString();
		nTabledNumber_Label.Text = num2.ToString();
		repAllButton.Enabled = num != 0;
	}

	private bool BeginNetworkAction(ListViewItem item, NetworkAction networkAction)
	{
		return BeginNetworkAction(item, networkAction, null);
	}

	private bool BeginNetworkAction(ListViewItem item, NetworkAction networkAction, object[] naArgs)
	{
		if (item == null)
		{
			return false;
		}
		MyTag itemTag = GetItemTag(item);
		if (itemTag == null)
		{
			return false;
		}
		if (itemTag.BW.IsBusy)
		{
			return false;
		}
		if (itemTag.LinkType == LinkType.TcpOffline)
		{
			return false;
		}
		itemTag.NetworkAction = networkAction;
		switch (networkAction)
		{
		case NetworkAction.UploadInfo:
			itemTag.Args = new object[9]
			{
				string.Empty,
				string.Empty,
				-1,
				string.Empty,
				string.Empty,
				string.Empty,
				0,
				string.Empty,
				string.Empty
			};
			item.SubItems[6].Text = Program.GetLang("pw_Initialize");
			break;
		case NetworkAction.DownloadInfo:
			itemTag.Args = new object[9]
			{
				naArgs[0],
				naArgs[1],
				naArgs[2],
				string.Empty,
				string.Empty,
				string.Empty,
				0,
				string.Empty,
				string.Empty
			};
			item.SubItems[6].Text = Program.GetLang("pw_Rename");
			break;
		case NetworkAction.UploadTime:
			itemTag.Args = new object[1]
			{
				new DateTime(2000, 1, 1, 0, 0, 0)
			};
			item.SubItems[6].Text = Program.GetLang("pw_LinkTest");
			break;
		case NetworkAction.DownloadTime:
			itemTag.Args = new object[1] { DateTime.Now };
			item.SubItems[6].Text = Program.GetLang("pw_TimeSynchronization");
			break;
		case NetworkAction.UploadECS:
			if (naArgs == null)
			{
				itemTag.Args = new object[12]
				{
					false,
					specCheckBox.Checked,
					stringCheckBox.Checked,
					faceCheckBox.Checked ? faceListComboBox.SelectedValue : "",
					deptCheckBox.Checked,
					classCheckBox.Checked,
					unitCheckBox.Checked,
					pLUCheckBox.CheckState,
					barcodeCheckBox.Checked,
					labelCheckBox.Checked,
					salesmanCheckBox.Checked,
					vipCheckBox.Checked
				};
			}
			else
			{
				itemTag.Args = naArgs;
			}
			item.SubItems[6].Text = Program.GetLang("pw_UploadData");
			break;
		case NetworkAction.DownloadECS:
			if (naArgs == null)
			{
				itemTag.Args = new object[21]
				{
					false,
					clearCheckBox.Checked,
					specCheckBox.Checked,
					stringCheckBox.Checked,
					faceCheckBox.Checked ? faceListComboBox.SelectedValue : "",
					deptCheckBox.Checked,
					classCheckBox.Checked,
					unitCheckBox.Checked,
					pLUCheckBox.CheckState,
					barcodeCheckBox.Checked,
					labelCheckBox.Checked,
					salesmanCheckBox.Checked,
					(!fontCheckBox.Checked) ? "" : ((fontComboBox.SelectedIndex == 0) ? "Font.bin" : ("Font\\" + (string)fontComboBox.SelectedItem + ".Bin")),
					bmpCheckBox.Checked,
					upgradeCheckBox.Checked,
					tMSCheckBox.Checked,
					upgradeFileBox.Text,
					tMSFileBox.Text,
					vipCheckBox.Checked ? ((!vipPointCheckBox.Checked) ? 1 : 2) : 0,
					0,
					wizardCheckBox.Checked
				};
			}
			else
			{
				itemTag.Args = naArgs;
			}
			item.SubItems[6].Text = Program.GetLang("pw_DownloadData");
			break;
		case NetworkAction.UploadReport:
			if (naArgs == null)
			{
				itemTag.Args = new object[2]
				{
					GetMac(item),
					false
				};
			}
			else
			{
				itemTag.Args = naArgs;
			}
			item.SubItems[6].Text = Program.GetLang("pw_UploadReport");
			break;
		case NetworkAction.DownloadIP:
			itemTag.Args = new object[12]
			{
				naArgs[0],
				naArgs[1],
				naArgs[2],
				naArgs[3],
				naArgs[4],
				naArgs[5],
				naArgs[6],
				naArgs[7],
				naArgs[8],
				naArgs[9],
				naArgs[10],
				naArgs[11]
			};
			item.SubItems[6].Text = Program.GetLang("pw_DownloadData");
			break;
		case NetworkAction.DownloadMAC:
			itemTag.Args = new object[6]
			{
				naArgs[0],
				naArgs[1],
				naArgs[2],
				naArgs[3],
				naArgs[4],
				naArgs[5]
			};
			item.SubItems[6].Text = Program.GetLang("pw_DownloadData");
			break;
		default:
			throw new InvalidOperationException();
		case NetworkAction.None:
			break;
		}
		itemTag.AsyEnd();
		itemTag.BW.RunWorkerAsync(itemTag);
		UpdateUI();
		return true;
	}

	private void BGW_GetLines_DoWork(object sender, DoWorkEventArgs e)
	{
		Thread.CurrentThread.CurrentUICulture = cultureInfo;
		e.Result = e.Argument;
		if (!(e.Argument is MyTag myTag))
		{
			return;
		}
		try
		{
			while (!myTag.BGW_GetLines.CancellationPending && myTag.Client.Connected && !myTag.RxClosing)
			{
				try
				{
					string text = myTag.sr.ReadLine();
					if (text != null)
					{
						if (text.Length >= 4 && text.Substring(0, 4) == "ASK\t")
						{
							myTag.RxAsk.Enqueue(text);
						}
						else if (text.Length > 0 && myTag.RxMFucing)
						{
							myTag.RxDATA.Enqueue(text);
						}
						goto IL_00b7;
					}
				}
				catch (Exception)
				{
					goto IL_00b7;
				}
				break;
				IL_00b7:
				if (!myTag.RxMFucing && myTag.RxAsk.Count > 0)
				{
					string ask = myTag.RxAsk.Dequeue();
					ask_fuc(myTag, ask);
				}
			}
			e.Cancel = myTag.BGW_GetLines.CancellationPending;
		}
		catch (Exception)
		{
		}
		finally
		{
			myTag.BGW_GetLines = null;
			Thread.Sleep(3000);
			RemoveLinkAsy(myTag, bNotify: false);
		}
	}

	private void BW_DoWork(object sender, DoWorkEventArgs e)
	{
		Thread.CurrentThread.CurrentUICulture = cultureInfo;
		e.Result = e.Argument;
		if (e.Argument is MyTag myTag)
		{
			switch (myTag.NetworkAction)
			{
			case NetworkAction.None:
				return;
			case NetworkAction.UploadInfo:
				UploadInfo(myTag);
				break;
			case NetworkAction.DownloadInfo:
				DownloadInfo(myTag);
				break;
			case NetworkAction.UploadTime:
				UploadTime(myTag);
				break;
			case NetworkAction.DownloadTime:
				DownloadTime(myTag);
				break;
			case NetworkAction.UploadECS:
				UploadECS(myTag);
				break;
			case NetworkAction.DownloadECS:
				DownloadECS(myTag);
				break;
			case NetworkAction.UploadReport:
				UploadReport(myTag);
				break;
			case NetworkAction.DownloadIP:
				DownloadIP(myTag);
				break;
			case NetworkAction.DownloadMAC:
				DownloadMAC(myTag);
				break;
			}
			e.Cancel = myTag.BW.CancellationPending;
		}
	}

	private bool UpdateInfo(ListViewItem item)
	{
		MyTag itemTag = GetItemTag(item);
		string text = (string)itemTag.Args[0];
		string text2 = (string)itemTag.Args[1];
		int num = (int)itemTag.Args[2];
		string text3 = (string)itemTag.Args[3];
		string text4 = (string)itemTag.Args[4];
		string text5 = (string)itemTag.Args[5];
		string text6 = (string)itemTag.Args[7];
		itemTag.P1S2 = (int)itemTag.Args[8];
		itemTag.Mac = (string)itemTag.Args[7];
		itemTag.IPP = item.SubItems[0].Text;
		string[] array = text3.Split(' ');
		if (array.Length >= 3 && array[2].Length >= 6)
		{
			decimal.TryParse(array[2].Substring(1, 4), out var result);
			itemTag.MinusUpload = result >= 2.38m;
		}
		if (!(text5 == ""))
		{
			text3 = ((!(text4 == text5) && !(text4 == "")) ? (text3 + '(' + text4 + '/' + text5) : (text3 + '(' + text5));
			text3 += ')';
		}
		foreach (ListViewItem item2 in listView.Items)
		{
			if (item2 == item || !(item2.SubItems[8].Text == text6))
			{
				continue;
			}
			MyTag itemTag2 = GetItemTag(item2);
			if (itemTag.P1S2 == 0 || itemTag2.P1S2 == 0 || itemTag.P1S2 == itemTag2.P1S2)
			{
				RemoveLink(item2, bNotify: false);
				continue;
			}
			if (itemTag.LinkType == LinkType.UdpClient)
			{
				itemTag2.CW_Another = itemTag.IPP;
				item2.SubItems[9].Text = itemTag.IPP;
				if (listView.Columns[9].Width < 80)
				{
					listView.Columns[9].Width = 164;
				}
				return true;
			}
			itemTag.CW_Another = itemTag2.IPP;
			item.SubItems[9].Text = itemTag2.IPP;
			if (listView.Columns[9].Width < 80)
			{
				listView.Columns[9].Width = 164;
			}
			RemoveLink(item2, bNotify: false);
		}
		string text7 = '★' + item.SubItems[1].Text + '★' + item.SubItems[2].Text + '★' + item.SubItems[3].Text;
		string text8 = '★' + text + '★' + text2 + '★' + num.ToString();
		if (text7 == text8 && item.SubItems[8].Text == text6)
		{
			return false;
		}
		item.SubItems[1].Text = text;
		item.SubItems[2].Text = text2;
		item.SubItems[3].Text = num.ToString();
		item.SubItems[4].Text = text3;
		item.SubItems[8].Text = text6;
		ReportDataSet.DeviceRow deviceRow = RDS.reportDataSet.Device.FindByMAC(text6);
		if (deviceRow != null)
		{
			if (deviceRow.Name != text8 && !FK_DeviceAdd(itemTag, text8, text6, -1, ""))
			{
				return true;
			}
		}
		else if (!Settings.Default.gen_MultiStock)
		{
			string deviceName = '★' + item.SubItems[1].Text + '★' + item.SubItems[2].Text + '★' + item.SubItems[3].Text;
			string mac = item.SubItems[8].Text;
			if (!FK_DeviceAdd(itemTag, deviceName, mac, 1, Program.GetLang("pw_Default")))
			{
				return true;
			}
		}
		UpdateTableTypeText(item);
		Program.mf.ShowBallonTip(Program.GetLang("pw_Online"), item.SubItems[0].Text + "\r\n" + '★' + item.SubItems[1].Text + '★' + item.SubItems[2].Text + '★' + item.SubItems[3].Text);
		ecsData_Log_Info(Program.GetLang("pw_Online") + " :" + string.Format(Program.GetLang("pw_cInfo_SingleDevice"), item.SubItems[8].Text, item.SubItems[0].Text));
		return false;
	}

	private ListViewItem GetItemFromBW(BackgroundWorker bw)
	{
		foreach (ListViewItem item in listView.Items)
		{
			MyTag itemTag = GetItemTag(item);
			if (itemTag.BW == bw)
			{
				return item;
			}
		}
		return null;
	}

	private void BW_RunWorkerCompleted(object sender, RunWorkerCompletedEventArgs e)
	{
		ListViewItem itemFromBW = GetItemFromBW(sender as BackgroundWorker);
		MyTag itemTag = GetItemTag(itemFromBW);
		if (itemTag == null)
		{
			return;
		}
		itemTag.AsyStart();
		if (e.Error != null)
		{
			RemoveLink(itemFromBW, bNotify: false);
			_ = itemTag.NetworkAction;
			itemTag.NetworkAction = NetworkAction.None;
		}
		else
		{
			NetworkAction networkAction = itemTag.NetworkAction;
			itemTag.NetworkAction = NetworkAction.None;
			if (e.Cancelled)
			{
				itemFromBW.SubItems[6].Text = Program.GetLang("pw_Cancelled");
			}
			else
			{
				itemFromBW.SubItems[6].Text = Program.GetLang("pw_Ready");
				switch (networkAction)
				{
				case NetworkAction.UploadInfo:
				case NetworkAction.DownloadInfo:
					if (UpdateInfo(itemFromBW))
					{
						RemoveLink(itemFromBW, bNotify: false);
						return;
					}
					break;
				case NetworkAction.DownloadMAC:
					UpdateInfo(itemFromBW);
					break;
				}
				if (itemTag.OnlineFucNo >= 0)
				{
					while (true)
					{
						if (itemTag.OnlineFucNo < uiDataSet.Network_Auto.Count)
						{
							UIDataSet.Network_AutoRow network_AutoRow = (UIDataSet.Network_AutoRow)uiDataSet.Network_Auto.Rows[itemTag.OnlineFucNo];
							itemTag.OnlineFucNo++;
							if (network_AutoRow.Due == 2)
							{
								BeginNetworkAction(itemFromBW, (NetworkAction)network_AutoRow.Task);
								break;
							}
							continue;
						}
						if (itemTag.OnlineFucNo < 10000)
						{
							itemTag.OnlineFucNo = 10000;
						}
						else
						{
							itemTag.OnlineFucNo++;
						}
						if (itemTag.OnlineFucNo == 10000)
						{
							if (gAsk && Settings.Default.gen_AskLogs)
							{
								if (num_onlineDevice < AskLogs_ExDevice)
								{
									BeginNetworkAction(itemFromBW, NetworkAction.UploadReport);
									break;
								}
								string item = itemFromBW.Text;
								if (!withReportIP.Contains(item))
								{
									withReportIP.Enqueue(item);
								}
							}
						}
						else
						{
							if (itemTag.OnlineFucNo != 10001 && itemTag.OnlineFucNo != 20001)
							{
								itemTag.OnlineFucNo = -1;
								break;
							}
							UpdateAsk(itemTag);
						}
					}
				}
				else
				{
					itemTag.OnlineFucNo = -1;
				}
				if (!itemTag.RxMFucing)
				{
					while (itemTag.RxAsk.Count > 0)
					{
						string ask = itemTag.RxAsk.Dequeue();
						if (ask_fuc(itemTag, ask))
						{
							break;
						}
					}
				}
			}
		}
		UpdateUI();
	}

	public void UpdateAskAll()
	{
		if (!gAsk)
		{
			return;
		}
		foreach (ListViewItem item in listView.Items)
		{
			MyTag itemTag = GetItemTag(item);
			if (itemTag != null && (itemTag.OnlineFucNo < 0 || itemTag.OnlineFucNo >= 20000))
			{
				itemTag.OnlineFucNo = 20000;
				if (!itemTag.BW.IsBusy)
				{
					UpdateAsk(itemTag);
				}
			}
		}
	}

	private void UpdateAsk(MyTag myTag)
	{
		if (!gAsk)
		{
			return;
		}
		int num = 0;
		if (string.Compare(myTag.nVersion, "V2.49A") >= 0)
		{
			if (Settings.Default.gen_AskLogs)
			{
				num++;
			}
			if (Settings.Default.gen_AskPLU)
			{
				num += 2;
			}
		}
		myTag.sw.WriteLine("DWL\tTMS\t");
		myTag.sw.WriteLine("TMS\t{0}\t{1}\t", 58, num);
		myTag.sw.WriteLine("END\tTMS\t");
	}

	private static void ReportProgress(MyTag myTag, string tip)
	{
		myTag.BW.ReportProgress(0, tip);
	}

	private void BW_ProgressChanged(object sender, ProgressChangedEventArgs e)
	{
		string value = e.UserState as string;
		if (!string.IsNullOrEmpty(value))
		{
			ListViewItem itemFromBW = GetItemFromBW(sender as BackgroundWorker);
			if (itemFromBW != null)
			{
				itemFromBW.SubItems[6].Text = value;
			}
		}
	}

	public NetForm()
	{
		InitializeComponent();
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
			return;
		}
		switch (Type)
		{
		case "Device":
		{
			foreach (ListViewItem item in listView.Items)
			{
				UpdateTableTypeText(item);
			}
			break;
		}
		case "PLU":
			pLUTableAdapter.ClearBeforeFill = true;
			pLUTableAdapter.Fill(ecsDataSet.PLU);
			break;
		case "Face":
			ecsDataSet.Face.Clear();
			faceListTableAdapter.ClearBeforeFill = true;
			faceListTableAdapter.Fill(ecsDataSet.FaceList);
			faceTableAdapter.Fill(ecsDataSet.Face);
			faceListBindingSource.ResetBindings(metadataChanged: false);
			faceListComboBox.SelectedValue = Settings.Default.ScFile_ScaleID;
			if (faceListComboBox.SelectedIndex == -1)
			{
				faceListComboBox.SelectedIndex = 0;
			}
			break;
		case "TXT":
			if (!txtPage_auto_checkbox.Checked)
			{
				txtfileTextBox.Text = Settings.Default.txtfilePath;
				typeTextBox.Text = Settings.Default.txtfileFormat;
				txtPage_clear_checkbox.Checked = Settings.Default.txtfileClear;
			}
			break;
		case "Excel":
			if (!excelPage_auto_checkbox.Checked)
			{
				excelTableAdapter.Fill(ecsDataSet.Excel);
				excelDefaultTableAdapter.Fill(ecsDataSet.ExcelDefault);
			}
			break;
		}
	}

	private void DataSet_Update(string Type)
	{
		if (Type == "Report" && num_onlineDevice < AskLogs_ExDevice && Settings.Default.gen_AskLogs_RefreshInterval >= 2 && Settings.Default.gen_AskLogs_RefreshInterval <= 10)
		{
			Program.mf.DataSet_Update_Report_Delay(Settings.Default.gen_AskLogs_RefreshInterval);
		}
		else
		{
			Program.mf.DataSet_Update(Type, "NetForm");
		}
	}

	private void ItemDefaultEnable_Change()
	{
		vipPointCheckBox.Enabled = vipCheckBox.Checked && saveButton.Checked;
		CheckBox checkBox = clearCheckBox;
		CheckBox checkBox2 = bmpCheckBox;
		bool flag = (tMSCheckBox.Enabled = saveButton.Checked);
		bool enabled = (checkBox2.Enabled = flag);
		checkBox.Enabled = enabled;
		CheckBox checkBox3 = upgradeCheckBox;
		bool enabled2 = (fontCheckBox.Enabled = saveButton.Checked && Program.right != Program.Right.User);
		checkBox3.Enabled = enabled2;
		if (openButton.Checked)
		{
			CheckBox checkBox4 = fontCheckBox;
			CheckBox checkBox5 = bmpCheckBox;
			CheckBox checkBox6 = upgradeCheckBox;
			bool flag5 = (tMSCheckBox.Checked = false);
			bool flag7 = (checkBox6.Checked = flag5);
			bool flag9 = (checkBox5.Checked = flag7);
			checkBox4.Checked = flag9;
		}
		TextBox textBox = upgradeFileBox;
		bool enabled3 = (upgradebrowseButton.Enabled = upgradeCheckBox.Checked);
		textBox.Enabled = enabled3;
		TextBox textBox2 = tMSFileBox;
		bool enabled4 = (tMSbrowseButton.Enabled = tMSCheckBox.Checked);
		textBox2.Enabled = enabled4;
	}

	private void ItemDefaultEnable()
	{
		specCheckBox.Enabled = Settings.Default.Enable_TMS;
		stringCheckBox.Enabled = Settings.Default.Enable_TMT;
		faceCheckBox.Enabled = Settings.Default.Enable_SCP;
		deptCheckBox.Enabled = Settings.Default.Enable_Dept;
		classCheckBox.Enabled = Settings.Default.Enable_Class;
		pLUCheckBox.Enabled = Settings.Default.Enable_PLU;
		labelCheckBox.Enabled = Settings.Default.Enable_Label;
		CheckBox checkBox = unitCheckBox;
		CheckBox checkBox2 = unitCheckBox;
		bool flag = (unitCheckBox.Checked = false);
		bool enabled = (checkBox2.Visible = flag);
		checkBox.Enabled = enabled;
		barcodeCheckBox.Enabled = Settings.Default.Enable_Barcode;
		salesmanCheckBox.Enabled = Settings.Default.Enable_Salesman;
		vipCheckBox.Enabled = Settings.Default.Enable_VIP;
		ItemDefaultEnable_Change();
	}

	public void TXT_Update()
	{
		if (txtPage_auto_checkbox.Checked)
		{
			return;
		}
		if (formtypeComboBox.Items.Count > 0)
		{
			formtypeComboBox.SelectedValue = Settings.Default.txtfileFormat;
			if (formtypeComboBox.SelectedIndex == -1)
			{
				formtypeComboBox.SelectedIndex = 0;
			}
		}
		else
		{
			formtypeComboBox.Visible = false;
			typeTextBox.Size = new Size(typeTextBox.Size.Width, typeTextBox.Location.Y + typeTextBox.Size.Height - formtypeComboBox.Location.Y);
			typeTextBox.Location = new Point(typeTextBox.Location.X, formtypeComboBox.Location.Y);
		}
		txtfileTextBox.Text = Settings.Default.txtfilePath;
		typeTextBox.Text = Settings.Default.txtfileFormat;
		txtPage_update_checkbox.Checked = Settings.Default.txtfileUpdate;
		txtPage_clear_checkbox.Checked = Settings.Default.txtfileClear;
	}

	private void NetForm_Load(object sender, EventArgs e)
	{
		AskLogs_ExDevice = Settings.Default.gen_AskLogs_ExDevice;
		ToolStripButton toolStripButton = expand_toolStripButton;
		bool visible = (shrink_ToolStripButton.Visible = false);
		toolStripButton.Visible = visible;
		expandshrink_ToolStrip.Visible = false;
		Label monitorDelay_B1_Label = MonitorDelay_B1_Label;
		string text = (MonitorDelay_B2_Label.Text = Program.GetLang("pw_MonitorDelay"));
		monitorDelay_B1_Label.Text = text;
		Label monitorDelay_E1_Label = MonitorDelay_E1_Label;
		string text2 = (MonitorDelay_E2_Label.Text = Program.GetLang("pw_Second"));
		monitorDelay_E1_Label.Text = text2;
		expand_toolStripButton.Text = Program.GetLang("pw_Expand");
		shrink_ToolStripButton.Text = Program.GetLang("pw_Shrink");
		string text3 = (ethernet_ToolStripLabel.Text = Program.GetLang("pw_Ethernet"));
		Text = text3;
		CheckBox checkBox = txtPage_autoclear_checkbox;
		string text4 = (excelPage_autoclear_checkbox.Text = Program.GetLang("pw_DeleteFileafterReading"));
		checkBox.Text = text4;
		addToolStripButton.Text = Program.GetLang("pw_AddDevice");
		allDefaultStock_Button.Text = Program.GetLang("pw_Attachautomatically");
		barcodeCheckBox.Text = Program.GetLang("pw_Barcode");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_Firstrecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		bmpCheckBox.Text = Program.GetLang("pw_Bitmap");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		cancelToolStripButton.Text = Program.GetLang("pw_Cancel");
		classCheckBox.Text = Program.GetLang("pw_Class");
		clearCheckBox.Text = Program.GetLang("pw_Clearolddata");
		clearToolStripButton.Text = Program.GetLang("pw_ClearAll");
		dataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_FieldName");
		dataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_DefaultValue");
		deleteToolStripButton.Text = Program.GetLang("pw_DeleteDevice");
		deptCheckBox.Text = Program.GetLang("pw_Dept");
		downloadButton.Text = Program.GetLang("pw_DownloadDatabase");
		ecsTabPage.Text = Program.GetLang("pw_Data");
		excelExebutton.Text = Program.GetLang("pw_DownloadToDevice");
		excelPage.Text = Program.GetLang("pw_ExcelCSVFile");
		excelPage_auto_checkbox.Text = Program.GetLang("pw_AutoRunning");
		excelPage_clear_checkbox.Text = Program.GetLang("pw_ClearPLUbeforeoperation");
		excelPage_systemtray_Button.Text = Program.GetLang("pw_MinimizetoSystemTray");
		excelPage_startup_Button.Text = Program.GetLang("pw_SetAsStartup");
		excelPage_update_checkbox.Text = Program.GetLang("pw_Usingupdatesoftwaredatabase");
		excelSelAllbutton.Text = Program.GetLang("pw_SelectAllDevices");
		exeButton.Text = Program.GetLang("pw_Execute");
		faceCheckBox.Text = Program.GetLang("pw_ShortcutKey");
		fieldColumn.HeaderText = Program.GetLang("pw_FieldName");
		findToolStripButton.Text = Program.GetLang("pw_FindDevice");
		fontCheckBox.Text = Program.GetLang("pw_Font");
		formtype.Text = Program.GetLang("pw_FileFormat");
		ipColumnHeader.Text = Program.GetLang("pw_IPAddress");
		ip2ColumnHeader.Text = Program.GetLang("pw_IPAddress_Backup");
		ipToolStripButton.Text = Program.GetLang("pw_SetIP");
		label1.Text = Program.GetLang("pw_Address");
		labelCheckBox.Text = Program.GetLang("pw_PrintFormat");
		logCheckBox.Text = Program.GetLang("pw_Login");
		MAC_ToolStripButton.Text = Program.GetLang("pw_NewMAC");
		machineNameColumnHeader.Text = Program.GetLang("pw_MachineName");
		machineNoColumnHeader.Text = Program.GetLang("pw_MachineNo");
		MACr_ToolStripButton.Text = Program.GetLang("pw_RestoreMAC");
		MDBsave_Button.Text = Program.GetLang("pw_Save");
		mdbTabPage.Text = Program.GetLang("pw_Database");
		nTabledInfo_Label.Text = Program.GetLang("pw_Deviceswithouttable");
		openButton.Text = Program.GetLang("pw_Upload_ToSoftware_");
		passowrdLabel.Text = Program.GetLang("pw_Password");
		pLUCheckBox.Text = Program.GetLang("pw_PLU");
		wizardCheckBox.Text = Program.GetLang("pw_ConfigWizard");
		reCheckBox.Text = Program.GetLang("pw_Sendall_VerySlow");
		renameToolStripButton.Text = Program.GetLang("pw_Rename");
		repAllButton.Text = Program.GetLang("pw_UploadAll");
		repButton.Text = Program.GetLang("pw_Upload");
		Report1_GroupBox.Text = Program.GetLang("pw_Tableattachoperation");
		Report2_GroupBox.Text = Program.GetLang("pw_Networkoperation");
		reportTabPage.Text = Program.GetLang("pw_Report");
		salesmanCheckBox.Text = Program.GetLang("pw_Salesman");
		saveButton.Text = Program.GetLang("pw_DownloadToDevice");
		selAllCheckBox.Text = Program.GetLang("pw_All");
		selAllToolStripButton.Text = Program.GetLang("pw_SelectAll");
		shopNameColumnHeader.Text = Program.GetLang("pw_ShopName");
		showButton.Text = Program.GetLang("pw_Show");
		shutToolStripButton.Text = Program.GetLang("pw_CloseDevice");
		specCheckBox.Text = Program.GetLang("pw_GlobalSpec");
		specifyStock_Button.Text = Program.GetLang("pw_SpecifyStock");
		statusColumnHeader.Text = Program.GetLang("pw_NetworkStatus");
		stringCheckBox.Text = Program.GetLang("pw_GlobalText");
		tableColumnHeader.Text = Program.GetLang("pw_StockTable");
		TabledAutoReNumber_CheckBox.Text = Program.GetLang("pw_Changemachinenumber");
		TabledInfo_Label.Text = Program.GetLang("pw_Deviceswithtable");
		taskToolStripButton.Text = Program.GetLang("pw_AutoTask");
		timeToolStripButton.Text = Program.GetLang("pw_Time");
		tMSCheckBox.Text = Program.GetLang("pw_TMSFile");
		toolStripButton1.Text = Program.GetLang("pw_AddNew");
		toolStripButton2.Text = Program.GetLang("pw_Delete");
		toolStripButton3.Text = Program.GetLang("pw_Firstrecord");
		toolStripButton4.Text = Program.GetLang("pw_PreviousRecord");
		toolStripButton5.Text = Program.GetLang("pw_NextRecord");
		toolStripButton6.Text = Program.GetLang("pw_LastRecord");
		toolStripButton7.Text = Program.GetLang("pw_ClearAll");
		txtExebutton.Text = Program.GetLang("pw_DownloadToDevice");
		txtfile.Text = Program.GetLang("pw_FileName");
		txtPage.Text = Program.GetLang("pw_CustomFile");
		txtPage_auto_checkbox.Text = Program.GetLang("pw_AutoRunning");
		txtPage_clear_checkbox.Text = Program.GetLang("pw_ClearPLUbeforeoperation");
		txtPage_systemtray_Button.Text = Program.GetLang("pw_MinimizetoSystemTray");
		txtPage_startup_Button.Text = Program.GetLang("pw_SetAsStartup");
		txtPage_update_checkbox.Text = Program.GetLang("pw_Usingupdatesoftwaredatabase");
		txtSelAllbutton.Text = Program.GetLang("pw_SelectAllDevices");
		typeColumnHeader.Text = Program.GetLang("pw_Type");
		unitCheckBox.Text = Program.GetLang("pw_Unit");
		upgradeCheckBox.Text = Program.GetLang("pw_Upgrade");
		uploadButton.Text = Program.GetLang("pw_UploadDatabase");
		usernameLabel.Text = Program.GetLang("pw_UserName");
		vipCheckBox.Text = Program.GetLang("pw_VIP");
		vipPointCheckBox.Text = Program.GetLang("pw_UpdatePoints");
		Font = Settings.Default.CustomFont;
		if (!wizardCheckBox.Checked)
		{
			ItemDefaultEnable();
		}
		selAllCheckBox.Enabled = Settings.Default.Enable_ImExport_All;
		if (Program.right == Program.Right.User)
		{
			if (!Settings.Default.Enable_CustomFile)
			{
				txtPage.Parent = null;
			}
			if (!Settings.Default.Enable_ExcelFile)
			{
				excelPage.Parent = null;
			}
			if (!Settings.Default.Enable_ImExport_Database)
			{
				mdbTabPage.Parent = null;
			}
		}
		gAsk = Settings.Default.gen_Ask;
		string fileName = Application.StartupPath + "\\Combo.xml";
		uiDataSet.TXTForm_Type.ReadXml(fileName);
		uiDataSet.PLU_Col.ReadXml(fileName);
		uiDataSet.SimCombo.ReadXml(fileName);
		recvTimeOut = Settings.Default.recvTimeOut;
		if (formtypeComboBox.Items.Count > 0)
		{
			formtypeComboBox.SelectedValue = Settings.Default.txtfileFormat;
			if (formtypeComboBox.SelectedIndex == -1)
			{
				formtypeComboBox.SelectedIndex = 0;
			}
		}
		else
		{
			formtypeComboBox.Visible = false;
			typeTextBox.Size = new Size(typeTextBox.Size.Width, typeTextBox.Location.Y + typeTextBox.Size.Height - formtypeComboBox.Location.Y);
			typeTextBox.Location = new Point(typeTextBox.Location.X, formtypeComboBox.Location.Y);
		}
		txtfileTextBox.Text = Settings.Default.txtfilePath;
		typeTextBox.Text = Settings.Default.txtfileFormat;
		txtPage_clear_checkbox.Checked = Settings.Default.txtfileClear;
		CheckBox checkBox2 = txtPage_clear_checkbox;
		bool visible2 = (txtPage_update_checkbox.Checked = Settings.Default.txtfileUpdate);
		checkBox2.Visible = visible2;
		txtPage_autoclear_checkbox.Checked = Settings.Default.txtfileAutoClear;
		txtPage_MonitorDelay_NumericUpDown.Value = Settings.Default.txtfileDelay;
		excelTableAdapter.Fill(ecsDataSet.Excel);
		excelDefaultTableAdapter.Fill(ecsDataSet.ExcelDefault);
		excelfileTextBox.Text = Settings.Default.excelfilePath;
		CheckBox checkBox3 = excelPage_clear_checkbox;
		bool visible3 = (excelPage_update_checkbox.Checked = Settings.Default.excelfileUpdate);
		checkBox3.Visible = visible3;
		excelPage_clear_checkbox.Checked = Settings.Default.excelfileClear;
		excelPage_autoclear_checkbox.Checked = Settings.Default.excelfileAutoClear;
		excelPage_MonitorDelay_NumericUpDown.Value = Settings.Default.excelfileDelay;
		Program.LabelRight_SetXLocaltion(new Label[1] { MonitorDelay_B1_Label }, new Control[2] { txtPage_MonitorDelay_NumericUpDown, MonitorDelay_E1_Label });
		Program.LabelRight_SetXLocaltion(new Label[1] { MonitorDelay_B2_Label }, new Control[2] { excelPage_MonitorDelay_NumericUpDown, MonitorDelay_E2_Label });
		faceListTableAdapter.Fill(ecsDataSet.FaceList);
		faceListComboBox.SelectedValue = Settings.Default.ScFile_ScaleID;
		if (faceListComboBox.SelectedIndex == -1)
		{
			faceListComboBox.SelectedIndex = 0;
		}
		DataSet_Refresh("Report");
		DataSet_Refresh("PLU");
		string path = Application.StartupPath + "\\Binary\\Font";
		DirectoryInfo directoryInfo = new DirectoryInfo(path);
		fontComboBox.BeginUpdate();
		int selectedIndex = fontComboBox.Items.Add(Program.GetLang("pw_FontBuilder"));
		fontComboBox.SelectedIndex = selectedIndex;
		if (directoryInfo.Exists)
		{
			FileInfo[] files = directoryInfo.GetFiles("*.bin");
			foreach (FileInfo fileInfo in files)
			{
				string text5 = fileInfo.Name.Replace(".bin", "");
				if (text5 != Program.GetLang("pw_FontBuilder") && text5 != "")
				{
					fontComboBox.Items.Add(text5);
				}
			}
		}
		fontComboBox.EndUpdate();
		fontComboBox.Visible = fontComboBox.Items.Count > 1;
		StringCollection ipList = Settings.Default.ipList;
		StringEnumerator enumerator = ipList.GetEnumerator();
		try
		{
			while (enumerator.MoveNext())
			{
				string current = enumerator.Current;
				string[] array = current.Split('\n');
				string[] array2 = array[0].Split(':');
				if (array2.Length == 2)
				{
					int port;
					IPAddress address;
					try
					{
						port = int.Parse(array2[1]);
						address = IPAddress.Parse(array2[0]);
					}
					catch
					{
						continue;
					}
					IPEndPoint iPEndPoint = new IPEndPoint(address, port);
					ListViewItem listViewItem = new ListViewItem(new string[10]
					{
						iPEndPoint.ToString(),
						(array.Length > 1) ? array[1] : string.Empty,
						(array.Length > 2) ? array[2] : string.Empty,
						(array.Length > 3) ? array[3] : string.Empty,
						(array.Length > 4) ? array[4] : string.Empty,
						GetTableTypeText_Un(),
						Program.GetLang("pw_Offline"),
						(listView.Items.Count + 1).ToString(),
						(array.Length > 5) ? array[5] : string.Empty,
						string.Empty
					}, GetLinkTypeImage(LinkType.TcpOffline));
					listViewItem.Tag = new MyTag(null, LinkType.TcpOffline, TableType.Unattached, this);
					listView.Items.Add(listViewItem);
					Thread thread = new Thread(TcpClientThread);
					thread.Start(iPEndPoint);
				}
			}
		}
		finally
		{
			if (enumerator is IDisposable disposable)
			{
				disposable.Dispose();
			}
		}
		tcpServerThread = new Thread(TcpServerThread);
		tcpServerThread.Name = "TCPServer";
		tcpServerThread.Start();
		udpClientThread = new Thread(UdpClientThread);
		udpClientThread.Name = "UDPClient";
		udpClientThread.Start();
		BroadCast();
		progressLabel.Text = Program.GetLang("pw_Ready");
		fileComboBox.SelectedIndex = Settings.Default.ftptarget;
		uriTextBox.Text = Settings.Default.ftpurl;
		if (uriTextBox.Text == "")
		{
			uriTextBox.Text = "ftp://";
			logCheckBox.Checked = false;
			TextBox textBox = usernameTextBox;
			string text6 = (passwordTextBox.Text = "");
			textBox.Text = text6;
		}
		else if (Settings.Default.ftpuser == "")
		{
			logCheckBox.Checked = false;
			TextBox textBox2 = usernameTextBox;
			string text8 = (passwordTextBox.Text = "");
			textBox2.Text = text8;
		}
		else
		{
			logCheckBox.Checked = true;
			usernameTextBox.Text = Settings.Default.ftpuser;
			passwordTextBox.Text = Settings.Default.ftppass;
		}
		string text10 = Application.StartupPath + "\\AutoTask.xml";
		if (File.Exists(text10))
		{
			uiDataSet.Network_Auto.ReadXml(text10);
			CreateTimers();
		}
		UpdateUI();
		InitCustom();
		statusColumnHeader.DisplayIndex = 2;
		reportTimer.Interval = Settings.Default.gen_AskLogs_ExInterval * 1000;
		reportTimer.Enabled = true;
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

	private bool CloseThread_BW()
	{
		if (listView.InvokeRequired)
		{
			Invoke(new CloseThread_BW_Callback(CloseThread_BW), null);
		}
		else
		{
			foreach (ListViewItem item3 in listView.Items)
			{
				MyTag itemTag = GetItemTag(item3);
				if (itemTag != null)
				{
					itemTag.OnlineFucNo = -1;
					if (itemTag.BW.IsBusy)
					{
						itemTag.BW.CancelAsync();
					}
				}
			}
			foreach (ListViewItem item4 in listView.Items)
			{
				MyTag itemTag = GetItemTag(item4);
				if (itemTag != null)
				{
					if (itemTag.BW.IsBusy)
					{
						return false;
					}
					RemoveLink(item4, bNotify: false, closing: true);
				}
			}
		}
		return true;
	}

	private void CloseThread()
	{
		if (tcpListener != null)
		{
			tcpListener.Stop();
		}
		tcpServerThread.Abort();
		tcpServerThread.Join();
		if (udpClient != null)
		{
			udpClient.Close();
		}
		udpClientThread.Abort();
		udpClientThread.Join();
		DestroyTimers();
		while (webClient.IsBusy)
		{
			Thread.Sleep(100);
		}
		while (!CloseThread_BW())
		{
			Thread.Sleep(100);
		}
		closeFinish = true;
		goClosed();
	}

	private void NetForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		if (!closing)
		{
			StringCollection stringCollection = new StringCollection();
			stringCollection.Clear();
			foreach (ListViewItem item in listView.Items)
			{
				MyTag itemTag = GetItemTag(item);
				if (itemTag.LinkType == LinkType.TcpClient)
				{
					stringCollection.Add(item.SubItems[0].Text + '\n' + string.Format(Settings.Default.FXP_Offline, item.SubItems[1].Text) + '\n' + string.Format(Settings.Default.FXP_Offline, item.SubItems[2].Text) + '\n' + string.Format(Settings.Default.FXP_Offline, item.SubItems[3].Text) + '\n' + string.Format(Settings.Default.FXP_Offline, item.SubItems[4].Text) + '\n' + MACmustChange(item.SubItems[8].Text));
				}
				else if (itemTag.LinkType == LinkType.TcpOffline)
				{
					stringCollection.Add(item.SubItems[0].Text + '\n' + item.SubItems[1].Text + '\n' + item.SubItems[2].Text + '\n' + item.SubItems[3].Text + '\n' + item.SubItems[4].Text + '\n' + item.SubItems[8].Text);
				}
			}
			Settings.Default.ipList = stringCollection;
			Settings.Default.Save();
			closeThread = new Thread(CloseThread);
			closeThread.Name = "CloseNetwork";
			closeThread.Start();
			closing = true;
			e.Cancel = true;
		}
		else if (!closeFinish)
		{
			e.Cancel = true;
		}
	}

	private static bool UploadInfo_Part(MyTag myTag)
	{
		_ = myTag.Client;
		bool flag = false;
		bool flag2 = false;
		myTag.AsyReadClear();
		while (!flag2 && !myTag.BW.CancellationPending)
		{
			myTag.sw.WriteLine("UPL\tMAC\t");
			while (!myTag.BW.CancellationPending)
			{
				string text = myTag.AsyReadLine();
				if (text == null)
				{
					throw new IOException();
				}
				string[] array = text.Split('\t');
				if (array[0] == "END")
				{
					break;
				}
				if (array[0] == "MAC")
				{
					try
					{
						myTag.Args[7] = int.Parse(array[1]).ToString("X2") + int.Parse(array[2]).ToString("X2") + int.Parse(array[3]).ToString("X2") + int.Parse(array[4]).ToString("X2") + int.Parse(array[5]).ToString("X2") + int.Parse(array[6]).ToString("X2");
						flag2 = true;
					}
					catch (IndexOutOfRangeException)
					{
					}
				}
			}
		}
		flag2 = false;
		myTag.Args[8] = 0;
		myTag.AsyReadClear();
		while (!flag2 && !myTag.BW.CancellationPending)
		{
			myTag.sw.WriteLine("UPL\tINF\t");
			while (!myTag.BW.CancellationPending)
			{
				string text = myTag.AsyReadLine();
				if (text == null)
				{
					throw new IOException();
				}
				string[] array = text.Split('\t');
				if (array[0] == "END")
				{
					break;
				}
				if (array[0] == "INM")
				{
					try
					{
						if (array[2] != "")
						{
							if (array[2].Substring(0, 4) == "ZZZZ")
							{
								myTag.Args[7] = "000000000000";
							}
							else
							{
								myTag.Args[7] = array[2];
							}
						}
						myTag.Args[8] = Program.ParseInt(array[3]);
					}
					catch (Exception)
					{
					}
				}
				else if (array[0] == "INA")
				{
					try
					{
						myTag.Args[4] = array[1];
						myTag.Args[5] = array[2];
						myTag.Args[6] = Program.ParseInt(array[3]);
						if (array.Length >= 6)
						{
							myTag.mem_DATA = Program.ParseInt(array[4]);
							myTag.mem_FONT = Program.ParseInt(array[5]);
						}
						else
						{
							myTag.mem_DATA = 0;
							myTag.mem_FONT = 0;
						}
						string text2 = (string)myTag.Args[4];
						string text3 = (string)myTag.Args[5];
						if (text3 == "")
						{
							continue;
						}
						if (text2 == text3 || text2 == "")
						{
							Encoding encoding = Encoding.GetEncoding(text3);
							if (encoding.CodePage != myTag.Enc.CodePage)
							{
								myTag.Enc = encoding;
								myTag.PTOK = false;
								flag = true;
							}
						}
						else
						{
							Encoding encoding2 = Encoding.GetEncoding(text2);
							if (encoding2.CodePage != myTag.Enc.CodePage)
							{
								myTag.Enc = encoding2;
								myTag.PTOK = false;
								flag = true;
							}
						}
					}
					catch (IndexOutOfRangeException)
					{
					}
				}
				else
				{
					if (!(array[0] == "INF"))
					{
						continue;
					}
					try
					{
						myTag.Args[0] = array[1];
						myTag.Args[1] = array[2];
						myTag.Args[2] = Program.ParseInt(array[3], -1);
						myTag.Args[3] = array[4];
						string[] array2 = array[4].Split(' ');
						if (array2.Length <= 1)
						{
							myTag.nVersion = "";
							myTag.cVersion = "";
							myTag.tVersion = "";
						}
						else if (array2.Length == 2)
						{
							myTag.nVersion = array2[1];
							myTag.cVersion = "";
							myTag.tVersion = array2[0];
						}
						else
						{
							myTag.nVersion = array2[array2.Length - 1];
							myTag.cVersion = array2[array2.Length - 2];
							myTag.tVersion = array2[0];
						}
						flag2 = true;
					}
					catch (IndexOutOfRangeException)
					{
					}
				}
			}
		}
		myTag.sw.WriteLine("UPL\tEND\t");
		if ((int)myTag.Args[2] == -1)
		{
			Encoding encoding3 = Encoding.GetEncoding("ASCII");
			if (encoding3.CodePage != myTag.Enc.CodePage)
			{
				myTag.Enc = encoding3;
				myTag.PTOK = false;
				flag = true;
			}
		}
		myTag.Client_RW(!flag);
		return flag;
	}

	private static void UploadInfo(MyTag myTag)
	{
		if (myTag.Client != null)
		{
			while (UploadInfo_Part(myTag))
			{
			}
			if ((int)myTag.Args[2] == -1)
			{
				throw new IOException();
			}
		}
	}

	private static void DownloadIP(MyTag myTag)
	{
		TcpClient client = myTag.Client;
		if (client == null)
		{
			return;
		}
		myTag.sw.WriteLine();
		if (myTag.P1S2 <= 1)
		{
			myTag.sw.WriteLine("DWL\tTMS\t");
			for (int i = 0; i < 12; i++)
			{
				int num = (int)myTag.Args[i];
				myTag.sw.WriteLine("TMS\t{0}\t{1}\t", ((i >= 4) ? 154 : 150) + i, num);
			}
			myTag.sw.WriteLine("END\tTMS\t");
		}
		else if (myTag.P1S2 == 2)
		{
			myTag.sw.WriteLine("DWL\tTMS\t");
			for (int j = 0; j < 12; j++)
			{
				int num2 = (int)myTag.Args[j];
				myTag.sw.WriteLine("TMS\t{0}\t{1}\t", 430 + j, num2);
			}
			myTag.sw.WriteLine("END\tTMS\t");
		}
	}

	private static void DownloadMAC(MyTag myTag)
	{
		TcpClient client = myTag.Client;
		if (client != null)
		{
			myTag.sw.WriteLine();
			myTag.sw.WriteLine("DWL\tMAC\t");
			myTag.sw.Write("MAC");
			for (int i = 0; i < 6; i++)
			{
				int num = (int)myTag.Args[i];
				myTag.sw.Write("\t{0}", num);
			}
			myTag.sw.WriteLine("\t");
			myTag.sw.WriteLine("END\tTMS\t");
			myTag.Args = new object[9]
			{
				string.Empty,
				string.Empty,
				-1,
				string.Empty,
				string.Empty,
				string.Empty,
				0,
				string.Empty,
				string.Empty
			};
			while (UploadInfo_Part(myTag))
			{
			}
			if ((int)myTag.Args[2] == -1)
			{
				throw new IOException();
			}
		}
	}

	private static void DownloadInfo(MyTag myTag)
	{
		TcpClient client = myTag.Client;
		if (client != null)
		{
			string arg = (string)myTag.Args[0];
			string arg2 = (string)myTag.Args[1];
			int num = (int)myTag.Args[2];
			myTag.sw.WriteLine();
			myTag.sw.WriteLine("DWL\tINF\t");
			myTag.sw.WriteLine("INF\t{0}\t{1}\t{2}\txxx\t", arg, arg2, num);
			myTag.sw.WriteLine("END\tINF\t");
			while (UploadInfo_Part(myTag))
			{
			}
			if ((int)myTag.Args[2] == -1)
			{
				throw new IOException();
			}
		}
	}

	private static void DownloadTime(MyTag myTag)
	{
		TcpClient client = myTag.Client;
		if (client != null)
		{
			DateTime dateTime = (DateTime)myTag.Args[0];
			myTag.sw.WriteLine();
			myTag.sw.WriteLine("DWL\tTIM\t");
			myTag.sw.WriteLine("TIM\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t", dateTime.Year % 100, dateTime.Month, dateTime.Day, dateTime.Hour, dateTime.Minute, dateTime.Second);
			myTag.sw.WriteLine("END\tTIM\t");
		}
	}

	private static void UploadTime(MyTag myTag)
	{
		TcpClient client = myTag.Client;
		if (client == null)
		{
			return;
		}
		DateTime dateTime = (DateTime)myTag.Args[0];
		int year = dateTime.Year;
		int month = dateTime.Month;
		int day = dateTime.Day;
		int hour = dateTime.Hour;
		int minute = dateTime.Minute;
		int second = dateTime.Second;
		myTag.AsyReadClear();
		myTag.sw.WriteLine();
		myTag.sw.WriteLine("UPL\tTIM\t");
		while (!myTag.BW.CancellationPending)
		{
			string text = myTag.AsyReadLine();
			if (text == null)
			{
				throw new IOException();
			}
			string[] array = text.Split('\t');
			if (array[0] == "END")
			{
				break;
			}
			if (array[0] == "TIM")
			{
				try
				{
					year = Program.ParseInt(array[1]) + 2000;
					month = Program.ParseInt(array[2], 1);
					day = Program.ParseInt(array[3], 1);
					hour = Program.ParseInt(array[4]);
					minute = Program.ParseInt(array[5]);
					second = Program.ParseInt(array[6]);
				}
				catch (IndexOutOfRangeException)
				{
				}
			}
		}
		myTag.sw.WriteLine("UPL\tEND\t");
		dateTime = new DateTime(year, month, day, hour, minute, second);
		myTag.Args[0] = dateTime;
	}

	private void UploadECS(MyTag myTag)
	{
		bool flag = false;
		while (!myTag.BW.CancellationPending && !flag)
		{
			try
			{
				Program.ecsLock.AcquireWriterLock(Settings.Default.recvTimeOut);
				flag = true;
			}
			catch (ApplicationException)
			{
				ReportProgress(myTag, Program.GetLang("pw_Databaseisinuse_"));
			}
		}
		if (myTag.BW.CancellationPending)
		{
			if (flag)
			{
				Program.ecsLock.ReleaseWriterLock();
			}
			return;
		}
		try
		{
			TcpClient client = myTag.Client;
			if (client == null)
			{
				return;
			}
			string empty = string.Empty;
			bool flag2 = (bool)myTag.Args[0];
			bool flag3 = (bool)myTag.Args[1];
			bool flag4 = (bool)myTag.Args[2];
			string text = (string)myTag.Args[3];
			bool flag5 = (bool)myTag.Args[4];
			bool flag6 = (bool)myTag.Args[5];
			bool flag7 = (CheckState)myTag.Args[7] != CheckState.Unchecked;
			bool flag8 = (bool)myTag.Args[8];
			bool flag9 = (bool)myTag.Args[9];
			bool flag10 = (bool)myTag.Args[10];
			bool flag11 = (bool)myTag.Args[11];
			myTag.sw.WriteLine();
			ReportProgress(myTag, Program.GetLang("pw_UpdatingDatabase"));
			if (specCheckBox.Checked)
			{
				specTableAdapter.ClearBeforeFill = true;
				specTableAdapter.Fill(ecsDataSet.Spec);
			}
			if (stringCheckBox.Checked)
			{
				stringTableAdapter.ClearBeforeFill = true;
				stringTableAdapter.Fill(ecsDataSet.String);
			}
			if (faceCheckBox.Checked)
			{
				ecsDataSet.Face.Clear();
				faceListTableAdapter.ClearBeforeFill = true;
				faceListTableAdapter.Fill(ecsDataSet.FaceList);
				faceTableAdapter.Fill(ecsDataSet.Face);
			}
			if (deptCheckBox.Checked)
			{
				deptTableAdapter.ClearBeforeFill = true;
				deptTableAdapter.Fill(ecsDataSet.Dept);
			}
			if (classCheckBox.Checked)
			{
				classTableAdapter.ClearBeforeFill = true;
				classTableAdapter.Fill(ecsDataSet.Class);
			}
			if (barcodeCheckBox.Checked)
			{
				barcodeTableAdapter.ClearBeforeFill = true;
				barcodeTableAdapter.Fill(ecsDataSet.Barcode);
			}
			if (labelCheckBox.Checked)
			{
				ecsDataSet.LabelItem.Clear();
				ecsDataSet.Label.Clear();
				labelTableAdapter.Fill(ecsDataSet.Label);
				labelItemTableAdapter.Fill(ecsDataSet.LabelItem);
			}
			if (salesmanCheckBox.Checked)
			{
				salesmanTableAdapter.ClearBeforeFill = true;
				salesmanTableAdapter.Fill(ecsDataSet.Salesman);
			}
			if (vipCheckBox.Checked)
			{
				vipTableAdapter.ClearBeforeFill = true;
				vipTableAdapter.Fill(ecsDataSet.VIP);
			}
			if (custom1CheckBox.Checked)
			{
				custom1TableAdapter.ClearBeforeFill = true;
				custom1TableAdapter.Fill(ecsDataSet.Custom1);
			}
			if (custom2CheckBox.Checked)
			{
				custom2TableAdapter.ClearBeforeFill = true;
				custom2TableAdapter.Fill(ecsDataSet.Custom2);
			}
			if (custom3CheckBox.Checked)
			{
				custom3TableAdapter.ClearBeforeFill = true;
				custom3TableAdapter.Fill(ecsDataSet.Custom3);
			}
			if (custom4CheckBox.Checked)
			{
				custom4TableAdapter.ClearBeforeFill = true;
				custom4TableAdapter.Fill(ecsDataSet.Custom4);
			}
			using (ECSDataSet eCSDataSet = new ECSDataSet())
			{
				myTag.AsyReadClear();
				if (flag3)
				{
					myTag.sw.WriteLine("UPL\tTMS\t");
					int num = 0;
					while (!myTag.BW.CancellationPending)
					{
						empty = myTag.AsyReadLine();
						if (empty == null)
						{
							throw new IOException();
						}
						string[] array = empty.Split('\t');
						if (array[0] == "END")
						{
							break;
						}
						if (array[0] != "TMS")
						{
							continue;
						}
						num++;
						ReportProgress(myTag, string.Format("{0} {1}", Program.GetLang("pw_GlobalSpec"), num));
						ECSDataSet.SpecRow specRow = eCSDataSet.Spec.NewSpecRow();
						try
						{
							specRow.SpecID = Program.ParseInt(array[1]);
							ECSDataSet.SpecRow specRow2 = ecsDataSet.Spec.FindBySpecID(specRow.SpecID);
							if (specRow2 != null)
							{
								if (!specRow2.Valid)
								{
									continue;
								}
								specRow.Valid = true;
								goto IL_04ef;
							}
							specRow.Valid = false;
							goto IL_04ef;
							IL_04ef:
							specRow.Value = Program.ParseInt(array[2]);
							goto IL_0503;
						}
						catch (IndexOutOfRangeException)
						{
							goto IL_0503;
						}
						IL_0503:
						eCSDataSet.Spec.AddSpecRow(specRow);
					}
					myTag.sw.WriteLine("UPL\tEND\t");
					if (myTag.BW.CancellationPending)
					{
						return;
					}
				}
				if (flag4)
				{
					myTag.sw.WriteLine("UPL\tTMT\t");
					int num = 0;
					while (!myTag.BW.CancellationPending)
					{
						empty = myTag.AsyReadLine();
						if (empty == null)
						{
							throw new IOException();
						}
						string[] array = empty.Split('\t');
						if (array[0] == "END")
						{
							break;
						}
						if (array[0] != "TMT")
						{
							continue;
						}
						num++;
						ReportProgress(myTag, string.Format("{0} {1}", Program.GetLang("pw_GlobalText"), num));
						ECSDataSet.StringRow stringRow = eCSDataSet.String.NewStringRow();
						try
						{
							stringRow.StringID = Program.ParseInt(array[1]);
							ECSDataSet.StringRow stringRow2 = ecsDataSet.String.FindByStringID(stringRow.StringID);
							if (stringRow2 != null)
							{
								if (!stringRow2.Valid)
								{
									continue;
								}
								stringRow.Valid = true;
								goto IL_062b;
							}
							stringRow.Valid = false;
							goto IL_062b;
							IL_062b:
							stringRow.Value = Program.ParseString(array[2]);
							goto IL_063f;
						}
						catch (IndexOutOfRangeException)
						{
							goto IL_063f;
						}
						IL_063f:
						eCSDataSet.String.AddStringRow(stringRow);
					}
					myTag.sw.WriteLine("UPL\tEND\t");
					if (myTag.BW.CancellationPending)
					{
						return;
					}
				}
				if (text.Length > 0)
				{
					faceListTableAdapter.Fill(eCSDataSet.FaceList);
					myTag.sw.WriteLine("UPL\tSCP\t");
					int num = 0;
					while (!myTag.BW.CancellationPending)
					{
						empty = myTag.AsyReadLine();
						if (empty == null)
						{
							throw new IOException();
						}
						string[] array = empty.Split('\t');
						if (array[0] == "END")
						{
							break;
						}
						if (!(array[0] != "SCP"))
						{
							num++;
							ReportProgress(myTag, string.Format("{0} {1}", Program.GetLang("pw_ShortcutKey"), num));
							ECSDataSet.FaceRow faceRow = eCSDataSet.Face.NewFaceRow();
							try
							{
								faceRow.ScaleID = text;
								faceRow.PageID = Program.ParseInt(array[1]);
								faceRow.KeyID = Program.ParseInt(array[2]);
								faceRow.PLUID = Program.ParseInt(array[3]);
							}
							catch (IndexOutOfRangeException)
							{
							}
							eCSDataSet.Face.AddFaceRow(faceRow);
						}
					}
					myTag.sw.WriteLine("UPL\tEND\t");
					if (myTag.BW.CancellationPending)
					{
						return;
					}
				}
				if (flag5)
				{
					myTag.sw.WriteLine("UPL\tDPT\t");
					int num = 0;
					while (!myTag.BW.CancellationPending)
					{
						empty = myTag.AsyReadLine();
						if (empty == null)
						{
							throw new IOException();
						}
						string[] array = empty.Split('\t');
						if (array[0] == "END")
						{
							break;
						}
						if (!(array[0] != "DPT"))
						{
							num++;
							ReportProgress(myTag, string.Format("{0} {1}", Program.GetLang("pw_Dept"), num));
							ECSDataSet.DeptRow deptRow = eCSDataSet.Dept.NewDeptRow();
							try
							{
								deptRow.DeptID = Program.ParseInt(array[1]);
								deptRow.Name = Program.ParseString(array[2]);
							}
							catch (IndexOutOfRangeException)
							{
							}
							if (!flag2 || deptRow.DeptID >= Settings.Default.minUserDeptID)
							{
								eCSDataSet.Dept.AddDeptRow(deptRow);
							}
						}
					}
					myTag.sw.WriteLine("UPL\tEND\t");
					if (myTag.BW.CancellationPending)
					{
						return;
					}
				}
				if (flag6)
				{
					myTag.sw.WriteLine("UPL\tCLS\t");
					int num = 0;
					while (!myTag.BW.CancellationPending)
					{
						empty = myTag.AsyReadLine();
						if (empty == null)
						{
							throw new IOException();
						}
						string[] array = empty.Split('\t');
						if (array[0] == "END")
						{
							break;
						}
						if (!(array[0] != "CLS"))
						{
							num++;
							ReportProgress(myTag, string.Format("{0} {1}", Program.GetLang("pw_Class"), num));
							ECSDataSet.ClassRow classRow = eCSDataSet.Class.NewClassRow();
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
							if (!flag2 || classRow.ClassID >= Settings.Default.minUserClassID)
							{
								eCSDataSet.Class.AddClassRow(classRow);
							}
						}
					}
					myTag.sw.WriteLine("UPL\tEND\t");
					if (myTag.BW.CancellationPending)
					{
						return;
					}
				}
				if (flag7)
				{
					myTag.sw.WriteLine("UPL\tPLU\t");
					int num = 0;
					while (!myTag.BW.CancellationPending)
					{
						empty = myTag.AsyReadLine();
						if (empty == null)
						{
							throw new IOException();
						}
						string[] array = empty.Split('\t');
						if (array[0] == "END")
						{
							break;
						}
						if (array[0] != "PLU")
						{
							continue;
						}
						num++;
						ReportProgress(myTag, string.Format("{0} {1}", Program.GetLang("pw_PLU"), num));
						ECSDataSet.PLURow pLURow = eCSDataSet.PLU.NewPLURow();
						try
						{
							pLURow.PLUID = Program.ParseInt(array[1]);
							if (eCSDataSet.PLU.FindByPLUID(pLURow.PLUID) != null)
							{
								continue;
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
							goto IL_0f2e;
						}
						catch (IndexOutOfRangeException)
						{
							goto IL_0f2e;
						}
						IL_0f2e:
						if (!flag2 || pLURow.PLUID >= Settings.Default.minUserPLUID)
						{
							eCSDataSet.PLU.AddPLURow(pLURow);
						}
					}
					myTag.sw.WriteLine("UPL\tEND\t");
					if (myTag.BW.CancellationPending)
					{
						return;
					}
				}
				if (flag8)
				{
					myTag.sw.WriteLine("UPL\tBAR\t");
					int num = 0;
					while (!myTag.BW.CancellationPending)
					{
						empty = myTag.AsyReadLine();
						if (empty == null)
						{
							throw new IOException();
						}
						string[] array = empty.Split('\t');
						if (array[0] == "END")
						{
							break;
						}
						if (!(array[0] != "BAR"))
						{
							num++;
							ReportProgress(myTag, string.Format("{0} {1}", Program.GetLang("pw_Barcode"), num));
							ECSDataSet.BarcodeRow barcodeRow = eCSDataSet.Barcode.NewBarcodeRow();
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
							if (!flag2 || barcodeRow.BarID >= Settings.Default.minUserBarcodeID)
							{
								eCSDataSet.Barcode.AddBarcodeRow(barcodeRow);
							}
						}
					}
					myTag.sw.WriteLine("UPL\tEND\t");
					if (myTag.BW.CancellationPending)
					{
						return;
					}
				}
				if (flag9)
				{
					myTag.sw.WriteLine("UPL\tLAB\t");
					int num = 0;
					while (!myTag.BW.CancellationPending)
					{
						empty = myTag.AsyReadLine();
						if (empty == null)
						{
							throw new IOException();
						}
						string[] array = empty.Split('\t');
						if (array[0] == "END")
						{
							break;
						}
						if (array[0] != "LAB")
						{
							continue;
						}
						num++;
						ReportProgress(myTag, string.Format("{0} {1}", Program.GetLang("pw_PrintFormat"), num));
						ECSDataSet.LabelRow labelRow = eCSDataSet.Label.NewLabelRow();
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
						if (flag2 && labelRow.LabelID < Settings.Default.minUserLabelID)
						{
							continue;
						}
						eCSDataSet.Label.AddLabelRow(labelRow);
						ecsDataSet.Label.FindByLabelID(labelRow.LabelID)?.Delete();
						while (!myTag.BW.CancellationPending)
						{
							empty = myTag.AsyReadLine();
							if (empty == null)
							{
								throw new IOException();
							}
							array = empty.Split('\t');
							if (array[0] == "LAE")
							{
								break;
							}
							if (!(array[0] != "LAS"))
							{
								ECSDataSet.LabelItemRow labelItemRow = eCSDataSet.LabelItem.NewLabelItemRow();
								try
								{
									labelItemRow.LabelID = labelRow.LabelID;
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
								eCSDataSet.LabelItem.AddLabelItemRow(labelItemRow);
							}
						}
					}
					myTag.sw.WriteLine("UPL\tEND\t");
					if (myTag.BW.CancellationPending)
					{
						return;
					}
				}
				if (flag10)
				{
					myTag.sw.WriteLine("UPL\tSAL\t");
					int num = 0;
					while (!myTag.BW.CancellationPending)
					{
						empty = myTag.AsyReadLine();
						if (empty == null)
						{
							throw new IOException();
						}
						string[] array = empty.Split('\t');
						if (array[0] == "END")
						{
							break;
						}
						if (!(array[0] != "SAL"))
						{
							num++;
							ReportProgress(myTag, string.Format("{0} {1}", Program.GetLang("pw_Salesman"), num));
							ECSDataSet.SalesmanRow salesmanRow = eCSDataSet.Salesman.NewSalesmanRow();
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
							if (!flag2 || salesmanRow.SalesmanID >= Settings.Default.minUserSalesmanID)
							{
								eCSDataSet.Salesman.AddSalesmanRow(salesmanRow);
							}
						}
					}
					myTag.sw.WriteLine("UPL\tEND\t");
					if (myTag.BW.CancellationPending)
					{
						return;
					}
				}
				if (flag11)
				{
					myTag.sw.WriteLine("UPL\tVIP\t");
					int num = 0;
					while (!myTag.BW.CancellationPending)
					{
						empty = myTag.AsyReadLine();
						if (empty == null)
						{
							throw new IOException();
						}
						string[] array = empty.Split('\t');
						if (array[0] == "END")
						{
							break;
						}
						if (!(array[0] != "VIP"))
						{
							num++;
							ReportProgress(myTag, string.Format("{0} {1}", Program.GetLang("pw_VIP"), num));
							ECSDataSet.VIPRow vIPRow = eCSDataSet.VIP.NewVIPRow();
							try
							{
								vIPRow.BAR = ((ulong)((long)Program.ParseInt(array[1]) * 1000000000L + Program.ParseInt(array[2]))).ToString();
								vIPRow.PH = ((ulong)((long)Program.ParseInt(array[3]) * 1000000000L + Program.ParseInt(array[4]))).ToString();
								vIPRow.Point = Program.ParseDecimal(array[5]);
								vIPRow.Discount = Program.ParseInt(array[6]);
							}
							catch (IndexOutOfRangeException)
							{
							}
							eCSDataSet.VIP.AddVIPRow(vIPRow);
						}
					}
					myTag.sw.WriteLine("UPL\tEND\t");
					if (myTag.BW.CancellationPending)
					{
						return;
					}
				}
				if (custom1CheckBox.Checked)
				{
					OpenCustom(eCSDataSet, myTag.sw, myTag.sr, custom1Row, myTag);
					if (myTag.BW.CancellationPending)
					{
						return;
					}
				}
				if (custom2CheckBox.Checked)
				{
					OpenCustom(eCSDataSet, myTag.sw, myTag.sr, custom2Row, myTag);
					if (myTag.BW.CancellationPending)
					{
						return;
					}
				}
				if (custom3CheckBox.Checked)
				{
					OpenCustom(eCSDataSet, myTag.sw, myTag.sr, custom3Row, myTag);
					if (myTag.BW.CancellationPending)
					{
						return;
					}
				}
				if (custom4CheckBox.Checked)
				{
					OpenCustom(eCSDataSet, myTag.sw, myTag.sr, custom4Row, myTag);
					if (myTag.BW.CancellationPending)
					{
						return;
					}
				}
				ReportProgress(myTag, Program.GetLang("pw_UpdatingDatabase"));
				ecsDataSet.Merge(eCSDataSet);
				if (flag3)
				{
					specTableAdapter.Update(ecsDataSet.Spec);
					DataSet_Update("Spec");
				}
				if (flag4)
				{
					stringTableAdapter.Update(ecsDataSet.String);
					DataSet_Update("String");
				}
				if (text.Length > 0)
				{
					faceTableAdapter.Update(ecsDataSet.Face);
					faceListTableAdapter.Update(ecsDataSet.FaceList);
					DataSet_Update("Face");
				}
				if (flag5)
				{
					deptTableAdapter.Update(ecsDataSet.Dept);
					DataSet_Update("Dept");
				}
				if (flag6)
				{
					classTableAdapter.Update(ecsDataSet.Class);
					DataSet_Update("Class");
				}
				if (flag7)
				{
					pLUTableAdapter.Update(ecsDataSet.PLU);
					DataSet_Update("PLU");
				}
				if (flag8)
				{
					barcodeTableAdapter.Update(ecsDataSet.Barcode);
					DataSet_Update("Barcode");
				}
				if (flag9)
				{
					labelTableAdapter.Update(ecsDataSet.Label);
					labelItemTableAdapter.Update(ecsDataSet.LabelItem);
					DataSet_Update("Label");
				}
				if (flag10)
				{
					salesmanTableAdapter.Update(ecsDataSet.Salesman);
					DataSet_Update("Salesman");
				}
				if (flag11)
				{
					vipTableAdapter.Update(ecsDataSet.VIP);
					DataSet_Update("VIP");
				}
				if (custom1CheckBox.Checked)
				{
					custom1TableAdapter.Update(ecsDataSet.Custom1);
					DataSet_Update("Custom1");
				}
				if (custom2CheckBox.Checked)
				{
					custom2TableAdapter.Update(ecsDataSet.Custom2);
					DataSet_Update("Custom2");
				}
				if (custom3CheckBox.Checked)
				{
					custom3TableAdapter.Update(ecsDataSet.Custom3);
					DataSet_Update("Custom3");
				}
				if (custom4CheckBox.Checked)
				{
					custom4TableAdapter.Update(ecsDataSet.Custom4);
					DataSet_Update("Custom4");
				}
			}
			ecsData_Log_Info(Program.GetLang("pw_Finish") + " :" + string.Format(Program.GetLang("pw_cInfo_SingleDevice"), myTag.Mac, myTag.IPP));
		}
		finally
		{
			Program.ecsLock.ReleaseWriterLock();
		}
	}

	private void DownloadECS(MyTag myTag)
	{
		bool flag = false;
		while (!myTag.BW.CancellationPending && !flag)
		{
			try
			{
				Program.ecsLock.AcquireReaderLock(Settings.Default.sendTimeOut);
				flag = true;
			}
			catch (ApplicationException)
			{
				ReportProgress(myTag, Program.GetLang("pw_Databaseisinuse_"));
			}
		}
		if (myTag.BW.CancellationPending)
		{
			if (flag)
			{
				Program.ecsLock.ReleaseReaderLock();
			}
			return;
		}
		try
		{
			TcpClient client = myTag.Client;
			if (client == null)
			{
				return;
			}
			bool flag2 = (bool)myTag.Args[0];
			bool flag3 = (bool)myTag.Args[1];
			bool flag4 = (bool)myTag.Args[2];
			bool flag5 = (bool)myTag.Args[3];
			string text;
			try
			{
				text = (string)myTag.Args[4];
			}
			catch (Exception)
			{
				text = "";
			}
			bool flag6 = (bool)myTag.Args[5];
			bool flag7 = (bool)myTag.Args[6];
			bool flag8 = (CheckState)myTag.Args[8] != CheckState.Unchecked;
			bool flag9 = (CheckState)myTag.Args[8] == CheckState.Indeterminate;
			bool flag10 = (bool)myTag.Args[9];
			bool flag11 = (bool)myTag.Args[10];
			bool flag12 = (bool)myTag.Args[11];
			string text2 = (string)myTag.Args[12];
			bool flag13 = (bool)myTag.Args[13];
			bool flag14 = (bool)myTag.Args[14];
			bool flag15 = (bool)myTag.Args[15];
			string path = (string)myTag.Args[16];
			string path2 = (string)myTag.Args[17];
			int num = (int)myTag.Args[18];
			int num2 = (int)myTag.Args[19];
			bool flag16 = (bool)myTag.Args[20];
			myTag.sw.WriteLine();
			myTag.sw.Flush();
			if (flag4)
			{
				if (flag3)
				{
					myTag.sw.WriteLine("CLR\tTMS\t");
					myTag.sw.WriteLine("CLR\tEND\t");
				}
				myTag.sw.WriteLine("DWL\tTMS\t");
				int count = ecsDataSet.Spec.Count;
				for (int i = 0; i < count; i++)
				{
					if (myTag.BW.CancellationPending)
					{
						break;
					}
					ECSDataSet.SpecRow specRow = ecsDataSet.Spec[i];
					if (specRow.Valid)
					{
						myTag.sw.WriteLine("TMS\t{0}\t{1}\t", specRow.SpecID, specRow.Value);
					}
					ReportProgress(myTag, string.Format("{0} {1} / {2} ({3}%)", Program.GetLang("pw_GlobalSpec"), i + 1, count, (i + 1) * 100 / count));
				}
				myTag.sw.WriteLine("END\tTMS\t");
				myTag.sw.Flush();
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (flag5)
			{
				if (flag3)
				{
					myTag.sw.WriteLine("CLR\tTMT\t");
					myTag.sw.WriteLine("CLR\tEND\t");
				}
				myTag.sw.WriteLine("DWL\tTMT\t");
				int count2 = ecsDataSet.String.Count;
				for (int j = 0; j < count2; j++)
				{
					if (myTag.BW.CancellationPending)
					{
						break;
					}
					ECSDataSet.StringRow stringRow = ecsDataSet.String[j];
					if (stringRow.Valid)
					{
						if (stringRow.StringID == 15 && myTag.swutf != null)
						{
							myTag.sw.Flush();
							myTag.swutf.WriteLine("TMT\t{0}\t{1}\t", stringRow.StringID, stringRow.Value);
							myTag.swutf.Flush();
						}
						else
						{
							myTag.sw.WriteLine("TMT\t{0}\t{1}\t", stringRow.StringID, stringRow.Value);
						}
					}
					ReportProgress(myTag, string.Format("{0} {1} / {2} ({3}%)", Program.GetLang("pw_GlobalText"), j + 1, count2, (j + 1) * 100 / count2));
				}
				myTag.sw.WriteLine("END\tTMT\t");
				myTag.sw.Flush();
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (text.Length > 0)
			{
				myTag.sw.WriteLine("DWL\tSCP\t");
				int count3 = ecsDataSet.Face.Count;
				for (int k = 0; k < count3; k++)
				{
					if (myTag.BW.CancellationPending)
					{
						break;
					}
					ECSDataSet.FaceRow faceRow = ecsDataSet.Face[k];
					if (faceRow.ScaleID == text)
					{
						if (flag3 || faceRow.PLUID != 0)
						{
							myTag.sw.WriteLine("SCP\t{0}\t{1}\t{2}\t", faceRow.PageID, faceRow.KeyID, faceRow.PLUID);
						}
						ReportProgress(myTag, string.Format("{0} {1} / {2} ({3}%)", Program.GetLang("pw_ShortcutKey"), k + 1, count3, (k + 1) * 100 / count3));
					}
				}
				myTag.sw.WriteLine("END\tSCP\t");
				myTag.sw.Flush();
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (flag6)
			{
				if (flag3)
				{
					myTag.sw.WriteLine("CLR\tDPT\t");
					myTag.sw.WriteLine("CLR\tEND\t");
				}
				myTag.sw.WriteLine("DWL\tDPT\t");
				int count4 = ecsDataSet.Dept.Count;
				for (int l = 0; l < count4; l++)
				{
					if (myTag.BW.CancellationPending)
					{
						break;
					}
					ECSDataSet.DeptRow deptRow = ecsDataSet.Dept[l];
					if (!flag2 || deptRow.DeptID >= Settings.Default.minUserDeptID)
					{
						myTag.sw.WriteLine("DPT\t{0}\t{1}\t", deptRow.DeptID, deptRow.Name);
						ReportProgress(myTag, string.Format("{0} {1} / {2} ({3}%)", Program.GetLang("pw_Dept"), l + 1, count4, (l + 1) * 100 / count4));
					}
				}
				myTag.sw.WriteLine("END\tDPT\t");
				myTag.sw.Flush();
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (flag7)
			{
				if (flag3)
				{
					myTag.sw.WriteLine("CLR\tCLS\t");
					myTag.sw.WriteLine("CLR\tEND\t");
				}
				myTag.sw.WriteLine("DWL\tCLS\t");
				int count5 = ecsDataSet.Class.Count;
				for (int m = 0; m < count5; m++)
				{
					if (myTag.BW.CancellationPending)
					{
						break;
					}
					ECSDataSet.ClassRow classRow = ecsDataSet.Class[m];
					if (!flag2 || classRow.ClassID >= Settings.Default.minUserClassID)
					{
						myTag.sw.WriteLine("CLS\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t", classRow.ClassID, classRow.Name, classRow.DeptID, classRow.LabelID1, classRow.BarT1, classRow.BarF1, classRow.LabelID2, classRow.BarT2, classRow.BarF2);
						ReportProgress(myTag, string.Format("{0} {1} / {2} ({3}%)", Program.GetLang("pw_Class"), m + 1, count5, (m + 1) * 100 / count5));
					}
				}
				myTag.sw.WriteLine("END\tCLS\t");
				myTag.sw.Flush();
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (flag8)
			{
				if (flag3)
				{
					myTag.sw.WriteLine("CLR\tPLU\t");
					myTag.sw.WriteLine("CLR\tEND\t");
				}
				myTag.sw.WriteLine("DWL\tPLU\t");
				if (num2 == 0)
				{
					int count6 = ecsDataSet.PLU.Count;
					for (int n = 0; n < count6; n++)
					{
						if (myTag.BW.CancellationPending)
						{
							break;
						}
						ECSDataSet.PLURow pLURow = ecsDataSet.PLU[n];
						if ((!flag2 || pLURow.PLUID >= Settings.Default.minUserPLUID) && (!flag9 || pLURow.Valid))
						{
							myTag.sw.WriteLine("PLU\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t{9}\t{10}\t{11}\t{12}\t{13}\t{14}\t{15}\t{16}\t{17}\t{18}\t{19}\t{20}\t{21}\t{22}\t{23}\t{24}\t{25}\t{26}\t{27}\t{28}\t{29}\t{30}\t{31}\t{32}\t{33}\t{34}\t{35}\t{36}\t{37}\t{38}\t{39}\t{40}\t{41}\t{42}\t{43}\t{44}\t{45}\t{46}\t{47}\t{48}\t{49}\t{50}\t{51}\t{52}\t{53}\t{54}\t{55}\t{56}\t{57}\t{58}\t{59}\t{60}\t{61}\t{62}\t{63}\t{64}\t{65}\t{66}\t", pLURow.PLUID, pLURow.Remark, pLURow.Index, pLURow.UnitID, Program.FormatDecimal(pLURow.Price, Program.DecimalFormat.Price), Program.FormatDecimal(pLURow.Cost, Program.DecimalFormat.Price), Program.FormatDecimal(pLURow.Tare, Program.DecimalFormat.Weight), pLURow.LabelID1, pLURow.BarT1, pLURow.BarF1, pLURow.LabelID2, pLURow.BarT2, pLURow.BarF2, pLURow.ClassID, Program.FormatString(pLURow.Name), Program.FormatString(pLURow.Text1), Program.FormatString(pLURow.Text2), Program.FormatString(pLURow.Text3), Program.FormatString(pLURow.Text4), Program.FormatString(pLURow.Text5), Program.FormatString(pLURow.Text6), Program.FormatString(pLURow.Text7), pLURow.PS_SD, pLURow.PS_ST, pLURow.PS_PD, pLURow.PS_PT, pLURow.PS_UD, pLURow.PC_SD, pLURow.PC_ST, pLURow.PC_PD, pLURow.PC_PT, pLURow.PC_UD, pLURow.DF_D, pLURow.DF_U, Program.FormatDecimal(pLURow.DF_DN, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DF_UN, Program.DecimalFormat.Weight), pLURow.DA_Sort1, pLURow.DA_Day1, Program.FormatDecimal(pLURow.DA_Dn1, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Up1, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Num1, Program.DecimalFormat.Price), pLURow.DA_Sort2, pLURow.DA_Day2, Program.FormatDecimal(pLURow.DA_Dn2, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Up2, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Num2, Program.DecimalFormat.Price), pLURow.DA_Sort3, pLURow.DA_Day3, Program.FormatDecimal(pLURow.DA_Dn3, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Up3, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Num3, Program.DecimalFormat.Price), pLURow.DA_Sort4, pLURow.DA_Day4, Program.FormatDecimal(pLURow.DA_Dn4, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Up4, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow.DA_Num4, Program.DecimalFormat.Price), pLURow.TaxType, pLURow.Tax, pLURow.SspValue1, pLURow.SspValue2, pLURow.SspValue3, pLURow.SspValue4, pLURow.SType, pLURow.ALPHA, pLURow.Flag, pLURow.Flag_Value, pLURow.Bitmap);
							ReportProgress(myTag, string.Format("{0} {1} / {2} ({3}%)", Program.GetLang("pw_PLU"), n + 1, count6, (n + 1) * 100 / count6));
						}
					}
				}
				else
				{
					ECSDataSet.PLURow pLURow2 = ecsDataSet.PLU.FindByPLUID(num2);
					myTag.sw.WriteLine("PLU\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t{9}\t{10}\t{11}\t{12}\t{13}\t{14}\t{15}\t{16}\t{17}\t{18}\t{19}\t{20}\t{21}\t{22}\t{23}\t{24}\t{25}\t{26}\t{27}\t{28}\t{29}\t{30}\t{31}\t{32}\t{33}\t{34}\t{35}\t{36}\t{37}\t{38}\t{39}\t{40}\t{41}\t{42}\t{43}\t{44}\t{45}\t{46}\t{47}\t{48}\t{49}\t{50}\t{51}\t{52}\t{53}\t{54}\t{55}\t{56}\t{57}\t{58}\t{59}\t{60}\t{61}\t{62}\t{63}\t{64}\t{65}\t{66}\t", pLURow2.PLUID, pLURow2.Remark, pLURow2.Index, pLURow2.UnitID, Program.FormatDecimal(pLURow2.Price, Program.DecimalFormat.Price), Program.FormatDecimal(pLURow2.Cost, Program.DecimalFormat.Price), Program.FormatDecimal(pLURow2.Tare, Program.DecimalFormat.Weight), pLURow2.LabelID1, pLURow2.BarT1, pLURow2.BarF1, pLURow2.LabelID2, pLURow2.BarT2, pLURow2.BarF2, pLURow2.ClassID, Program.FormatString(pLURow2.Name), Program.FormatString(pLURow2.Text1), Program.FormatString(pLURow2.Text2), Program.FormatString(pLURow2.Text3), Program.FormatString(pLURow2.Text4), Program.FormatString(pLURow2.Text5), Program.FormatString(pLURow2.Text6), Program.FormatString(pLURow2.Text7), pLURow2.PS_SD, pLURow2.PS_ST, pLURow2.PS_PD, pLURow2.PS_PT, pLURow2.PS_UD, pLURow2.PC_SD, pLURow2.PC_ST, pLURow2.PC_PD, pLURow2.PC_PT, pLURow2.PC_UD, pLURow2.DF_D, pLURow2.DF_U, Program.FormatDecimal(pLURow2.DF_DN, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow2.DF_UN, Program.DecimalFormat.Weight), pLURow2.DA_Sort1, pLURow2.DA_Day1, Program.FormatDecimal(pLURow2.DA_Dn1, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow2.DA_Up1, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow2.DA_Num1, Program.DecimalFormat.Price), pLURow2.DA_Sort2, pLURow2.DA_Day2, Program.FormatDecimal(pLURow2.DA_Dn2, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow2.DA_Up2, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow2.DA_Num2, Program.DecimalFormat.Price), pLURow2.DA_Sort3, pLURow2.DA_Day3, Program.FormatDecimal(pLURow2.DA_Dn3, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow2.DA_Up3, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow2.DA_Num3, Program.DecimalFormat.Price), pLURow2.DA_Sort4, pLURow2.DA_Day4, Program.FormatDecimal(pLURow2.DA_Dn4, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow2.DA_Up4, Program.DecimalFormat.Weight), Program.FormatDecimal(pLURow2.DA_Num4, Program.DecimalFormat.Price), pLURow2.TaxType, pLURow2.Tax, pLURow2.SspValue1, pLURow2.SspValue2, pLURow2.SspValue3, pLURow2.SspValue4, pLURow2.SType, pLURow2.ALPHA, pLURow2.Flag, pLURow2.Flag_Value, pLURow2.Bitmap);
				}
				myTag.sw.WriteLine("END\tPLU\t");
				myTag.sw.Flush();
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (flag10)
			{
				if (flag3)
				{
					myTag.sw.WriteLine("CLR\tBAR\t");
					myTag.sw.WriteLine("CLR\tEND\t");
				}
				myTag.sw.WriteLine("DWL\tBAR\t");
				int count7 = ecsDataSet.Barcode.Count;
				for (int num3 = 0; num3 < count7; num3++)
				{
					if (myTag.BW.CancellationPending)
					{
						break;
					}
					ECSDataSet.BarcodeRow barcodeRow = ecsDataSet.Barcode[num3];
					if (!flag2 || barcodeRow.BarID >= Settings.Default.minUserBarcodeID)
					{
						myTag.sw.WriteLine("BAR\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t", barcodeRow.BarID, barcodeRow.Name, barcodeRow.Format, barcodeRow.Check, barcodeRow.Num1, barcodeRow.Num2, barcodeRow.TChar);
						ReportProgress(myTag, string.Format("{0} {1} / {2} ({3}%)", Program.GetLang("pw_Barcode"), num3 + 1, count7, (num3 + 1) * 100 / count7));
					}
				}
				myTag.sw.WriteLine("END\tBAR\t");
				myTag.sw.Flush();
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (flag11)
			{
				if (flag3)
				{
					myTag.sw.WriteLine("CLR\tLAB\t");
					myTag.sw.WriteLine("CLR\tEND\t");
				}
				myTag.sw.WriteLine("DWL\tLAB\t");
				int count8 = ecsDataSet.Label.Count;
				for (int num4 = 0; num4 < count8; num4++)
				{
					if (myTag.BW.CancellationPending)
					{
						break;
					}
					ECSDataSet.LabelRow labelRow = ecsDataSet.Label[num4];
					if (labelRow.LabelID < Settings.Default.minUserLabelID || labelRow.LabelID > Settings.Default.maxLabelID)
					{
						continue;
					}
					myTag.sw.WriteLine("LAB\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t{9}\t{10}\t{11}\t{12}\t{13}\t{14}\t{15}\t{16}\t{17}\t{18}\t{19}\t{20}\t{21}\t{22}\t{23}\t{24}\t{25}\t{26}\t{27}\t{28}\t{29}\t{30}\t{31}\t{32}\t{33}\t{34}\t{35}\t{36}\t{37}\t", labelRow.LabelID, labelRow.Name, labelRow.Sort, labelRow.Width / 8, labelRow.Height / 8, Program.FormatString(labelRow.Text1), Program.FormatString(labelRow.Text2), Program.FormatString(labelRow.Text3), Program.FormatString(labelRow.Text4), Program.FormatString(labelRow.Text5), Program.FormatString(labelRow.Text6), Program.FormatString(labelRow.Text7), Program.FormatString(labelRow.Text8), Program.FormatString(labelRow.Text9), Program.FormatString(labelRow.Text10), Program.FormatString(labelRow.Text11), Program.FormatString(labelRow.Text12), Program.FormatString(labelRow.Text13), Program.FormatString(labelRow.Text14), Program.FormatString(labelRow.Text15), Program.FormatString(labelRow.Text16), labelRow.Version, Program.FormatString(labelRow.Text17), Program.FormatString(labelRow.Text18), Program.FormatString(labelRow.Text19), Program.FormatString(labelRow.Text20), Program.FormatString(labelRow.Text21), Program.FormatString(labelRow.Text22), Program.FormatString(labelRow.Text23), Program.FormatString(labelRow.Text24), Program.FormatString(labelRow.Text25), Program.FormatString(labelRow.Text26), Program.FormatString(labelRow.Text27), Program.FormatString(labelRow.Text28), Program.FormatString(labelRow.Text29), Program.FormatString(labelRow.Text30), Program.FormatString(labelRow.Text31), Program.FormatString(labelRow.Text32));
					ECSDataSet.LabelItemRow[] labelItemRows = labelRow.GetLabelItemRows();
					int num5 = labelItemRows.Length;
					for (int num6 = 0; num6 < num5; num6++)
					{
						if (myTag.BW.CancellationPending)
						{
							break;
						}
						ECSDataSet.LabelItemRow labelItemRow = labelItemRows[num6];
						myTag.sw.WriteLine("LAS\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t{7}\t{8}\t{9}\t{10}\t{11}\t", labelItemRow.SubID, labelItemRow.Flag1, labelItemRow.Flag2, labelItemRow.Flag3, labelItemRow.Print, labelItemRow.Angle, labelItemRow.Align, labelItemRow.Font, labelItemRow.Left, labelItemRow.Top, labelItemRow.Width, labelItemRow.Height);
					}
					myTag.sw.WriteLine("LAE\t");
					ReportProgress(myTag, string.Format("{0} {1} / {2} ({3}%)", Program.GetLang("pw_PrintFormat"), num4 + 1, count8, (num4 + 1) * 100 / count8));
				}
				myTag.sw.WriteLine("END\tLAB\t");
				myTag.sw.Flush();
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (flag12)
			{
				if (flag3)
				{
					myTag.sw.WriteLine("CLR\tSAL\t");
					myTag.sw.WriteLine("CLR\tEND\t");
				}
				myTag.sw.WriteLine("DWL\tSAL\t");
				int count9 = ecsDataSet.Salesman.Count;
				for (int num7 = 0; num7 < count9; num7++)
				{
					if (myTag.BW.CancellationPending)
					{
						break;
					}
					ECSDataSet.SalesmanRow salesmanRow = ecsDataSet.Salesman[num7];
					if (!flag2 || salesmanRow.SalesmanID >= Settings.Default.minUserSalesmanID)
					{
						myTag.sw.WriteLine("SAL\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}\t", salesmanRow.SalesmanID, salesmanRow.Name, salesmanRow.Password, salesmanRow.Discount_Low, salesmanRow.Discount_High, salesmanRow.RightFB, salesmanRow.Code);
						ReportProgress(myTag, string.Format("{0} {1} / {2} ({3}%)", Program.GetLang("pw_Salesman"), num7 + 1, count9, (num7 + 1) * 100 / count9));
					}
				}
				myTag.sw.WriteLine("END\tSAL\t");
				myTag.sw.Flush();
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (text2.Length > 0)
			{
				if (flag3)
				{
					myTag.sw.WriteLine("CLR\tFNT\t");
					myTag.sw.WriteLine("CLR\tEND\t");
				}
				string path3 = Application.StartupPath + "\\binary\\" + text2;
				if (File.Exists(path3))
				{
					myTag.sw.WriteLine("DWL\tFNT\t");
					myTag.sw.Write("FNT\t");
					byte[] array = File.ReadAllBytes(path3);
					int num8 = array.Length;
					int sendBufSize = Settings.Default.sendBufSize;
					for (int num9 = 0; num9 < num8; num9++)
					{
						if (myTag.BW.CancellationPending)
						{
							break;
						}
						byte b = array[num9];
						char value = (char)(64 + b / 16);
						char value2 = (char)(64 + b % 16);
						myTag.sw.Write(value);
						myTag.sw.Write(value2);
						if (num9 % sendBufSize == 0 || num9 == num8 - 1)
						{
							ReportProgress(myTag, string.Format("{0} {1} / {2} ({3}%)", Program.GetLang("pw_Font"), num9 + 1, num8, (num9 + 1) * 100 / num8));
						}
					}
					myTag.sw.WriteLine("\t");
					myTag.sw.WriteLine("END\tFNT\t");
					myTag.sw.Flush();
					if (myTag.BW.CancellationPending)
					{
						return;
					}
				}
			}
			if (flag13)
			{
				if (flag3)
				{
					myTag.sw.WriteLine("CLR\tBMP\t");
					myTag.sw.WriteLine("CLR\tEND\t");
				}
				myTag.sw.WriteLine("DWL\tBMP\t");
				int count10 = ecsDataSet.Bitmap.Count;
				for (int num10 = 0; num10 < count10; num10++)
				{
					if (myTag.BW.CancellationPending)
					{
						break;
					}
					ECSDataSet.BitmapRow bitmapRow = ecsDataSet.Bitmap[num10];
					string st = "";
					Program.getByte_multi((uint)bitmapRow.ID, ref st, 4);
					Program.getByte_multi((uint)((Image)bitmapRow.Picture).Size.Width, ref st, 2);
					Program.getByte_multi((uint)((Image)bitmapRow.Picture).Size.Height, ref st, 2);
					for (int num11 = 0; num11 < 22; num11++)
					{
						Program.getByte_multi(0u, ref st, 4);
					}
					st += bitmapRow.PicString;
					myTag.sw.WriteLine("BMP\t{0}\t{1}\t", bitmapRow.ID, st);
					ReportProgress(myTag, string.Format("{0}{1} {2} / {3} ({4}%)", Program.GetLang("pw_Bitmap"), bitmapRow.ID, num10 + 1, count10, (num10 + 1) * 100 / count10));
				}
				myTag.sw.WriteLine("END\tBMP\t");
				myTag.sw.Flush();
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (flag14 && File.Exists(path))
			{
				myTag.sw.WriteLine("DWL\tVER\t");
				myTag.sw.Write("VER\t");
				byte[] array2 = File.ReadAllBytes(path);
				int num12 = array2.Length;
				int sendBufSize2 = Settings.Default.sendBufSize;
				for (int num13 = 0; num13 < num12; num13++)
				{
					if (myTag.BW.CancellationPending)
					{
						break;
					}
					byte b2 = array2[num13];
					char value3 = (char)(64 + b2 / 16);
					char value4 = (char)(64 + b2 % 16);
					myTag.sw.Write(value3);
					myTag.sw.Write(value4);
					if (num13 % sendBufSize2 == 0 || num13 == num12 - 1)
					{
						ReportProgress(myTag, string.Format("{0} {1} / {2} ({3}%)", Program.GetLang("pw_Upgrade"), num13 + 1, num12, (num13 + 1) * 100 / num12));
					}
				}
				myTag.sw.WriteLine("\t");
				myTag.sw.WriteLine("END\tVER\t");
				myTag.sw.Flush();
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (flag15 && File.Exists(path2))
			{
				char[] array3 = File.ReadAllText(path2, myTag.Enc).ToCharArray();
				int num14 = array3.Length;
				int sendBufSize3 = Settings.Default.sendBufSize;
				for (int num15 = 0; num15 < num14; num15++)
				{
					if (myTag.BW.CancellationPending)
					{
						break;
					}
					myTag.sw.Write(array3[num15]);
					if (num15 % sendBufSize3 == 0 || num15 == num14 - 1)
					{
						ReportProgress(myTag, string.Format("{0} {1} / {2} ({3}%)", Program.GetLang("pw_TMSFile"), num15 + 1, num14, (num15 + 1) * 100 / num14));
					}
				}
				myTag.sw.Flush();
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (num > 0)
			{
				if (flag3)
				{
					myTag.sw.WriteLine("CLR\tVIP\t");
					myTag.sw.WriteLine("CLR\tEND\t");
				}
				myTag.sw.WriteLine("DWL\tVIP\t");
				int count11 = ecsDataSet.VIP.Count;
				for (int num16 = 0; num16 < count11; num16++)
				{
					if (myTag.BW.CancellationPending)
					{
						break;
					}
					ECSDataSet.VIPRow vIPRow = ecsDataSet.VIP[num16];
					long num17 = Convert.ToInt64(vIPRow.BAR);
					long num18;
					try
					{
						num18 = Convert.ToInt64(vIPRow.PH);
					}
					catch (Exception)
					{
						num18 = 0L;
					}
					decimal d = -1m;
					if (num > 1)
					{
						d = vIPRow.Point;
					}
					myTag.sw.WriteLine("VIP\t{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t", num17 / 1000000000, num17 % 1000000000, num18 / 1000000000, num18 % 1000000000, Program.FormatDecimal(d, Program.DecimalFormat.Price), vIPRow.Discount);
					ReportProgress(myTag, string.Format("{0} {1} / {2} ({3}%)", Program.GetLang("pw_Salesman"), num16 + 1, count11, (num16 + 1) * 100 / count11));
				}
				myTag.sw.WriteLine("END\tVIP\t");
				myTag.sw.Flush();
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (custom1CheckBox.Checked)
			{
				SaveCustom(myTag.sw, custom1Row, myTag);
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (custom2CheckBox.Checked)
			{
				SaveCustom(myTag.sw, custom2Row, myTag);
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (custom3CheckBox.Checked)
			{
				SaveCustom(myTag.sw, custom3Row, myTag);
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (custom4CheckBox.Checked)
			{
				SaveCustom(myTag.sw, custom4Row, myTag);
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			if (flag16)
			{
				myTag.sw.Write(Program.sWizard);
				myTag.sw.Flush();
				if (myTag.BW.CancellationPending)
				{
					return;
				}
			}
			ReportProgress(myTag, Program.GetLang("pw_WaitingDeviceUpdate"));
			DateTime dateTime = DateTime.Now.AddSeconds(30.0);
			myTag.sw.WriteLine();
			myTag.sw.WriteLine("UPL\tTIM\t");
			myTag.sw.Flush();
			while (!myTag.BW.CancellationPending)
			{
				if (DateTime.Now >= dateTime)
				{
					throw new IOException();
				}
				string text3;
				try
				{
					text3 = myTag.AsyReadLine();
				}
				catch (IOException)
				{
					continue;
				}
				string[] array4 = text3.Split('\t');
				if (array4[0] == "END")
				{
					break;
				}
				if (array4[0] == "TIM")
				{
					try
					{
						new DateTime(Program.ParseInt(array4[1]) + 2000, Program.ParseInt(array4[2], 1), Program.ParseInt(array4[3], 1), Program.ParseInt(array4[4]), Program.ParseInt(array4[5]), Program.ParseInt(array4[6]));
					}
					catch (IndexOutOfRangeException)
					{
					}
				}
			}
			myTag.sw.WriteLine("UPL\tEND\t");
			myTag.sw.Flush();
			ecsData_Log_Info(Program.GetLang("pw_Finish") + " :" + string.Format(Program.GetLang("pw_cInfo_SingleDevice"), myTag.Mac, myTag.IPP));
		}
		finally
		{
			Program.ecsLock.ReleaseReaderLock();
		}
	}

	private void UploadReport_Log_Info_Tip(string Info)
	{
		if (ReportInfo_TextBox.InvokeRequired)
		{
			Invoke(new UploadReport_Log_Info_Tip_Callback(UploadReport_Log_Info_Tip), Info);
			return;
		}
		string text = ReportInfo_TextBox.Text;
		if (text.Length >= 4096)
		{
			text.Substring(text.IndexOf("\r\n", 2048), 0);
		}
		DateTime now = DateTime.Now;
		ReportInfo_TextBox.Text = text + now.ToString(Settings.Default.gen_dtType_Time) + " " + Info;
	}

	private void UploadReport_Log_Info(string Info)
	{
		UploadReport_Log_Info_Tip(Info);
	}

	private void UploadReport_Log_Error_Tip(string Error)
	{
		if (ReportError_TextBox.InvokeRequired)
		{
			Invoke(new UploadReport_Log_Error_Tip_Callback(UploadReport_Log_Error_Tip), Error);
			return;
		}
		string text = ReportError_TextBox.Text;
		if (text.Length >= 4096)
		{
			text.Substring(text.IndexOf("\r\n", 2048), 0);
		}
		DateTime now = DateTime.Now;
		ReportError_TextBox.Text = text + now.ToString(Settings.Default.gen_dtType_Time) + " " + Error;
	}

	private void UploadReport_Log_Error(string Error)
	{
		UploadReport_Log_Error_Tip(Error);
	}

	private void ecsData_Log_Info_Tip(string Info)
	{
		if (ecsData_TextBox.InvokeRequired)
		{
			Invoke(new ecsData_Log_Info_Tip_Callback(ecsData_Log_Info_Tip), Info);
			return;
		}
		string text = ecsData_TextBox.Text;
		if (text.Length >= 4096)
		{
			text.Substring(text.IndexOf("\r\n", 2048), 0);
		}
		if (text.Length > 0)
		{
			text += "\r\n";
		}
		DateTime now = DateTime.Now;
		ecsData_TextBox.Text = text + now.ToString(Settings.Default.gen_dtType_Time) + " " + Info;
		if (Settings.Default.FXP_Logs_ECS)
		{
			Program.WriteFileLine("ECSData.txt", Info);
		}
	}

	private void ecsData_Log_Info(string Info)
	{
		ecsData_Log_Info_Tip(Info);
	}

	private void UploadReport(MyTag myTag)
	{
		string mac = myTag.Mac;
		ReportDataSet.DeviceRow deviceRow = RDS.reportDataSet.Device.FindByMAC(mac);
		if (deviceRow == null || deviceRow.GID == 0)
		{
			return;
		}
		StringBuilder stringBuilder = new StringBuilder(524288);
		TcpClient client = myTag.Client;
		if (client == null)
		{
			return;
		}
		myTag.sw.WriteLine();
		bool flag = false;
		string text3;
		try
		{
			bool flag2 = (bool)myTag.Args[1];
			ReportProgress(myTag, Program.GetLang("pw_UpdatingDatabase"));
			string text = string.Format(Program.GetLang("pw_cInfo_SingleDevice"), myTag.Mac, myTag.IPP);
			string text2 = "UPL\tREP\t";
			if (myTag.MinusUpload)
			{
				text2 += '-';
			}
			text2 = ((!flag2 && deviceRow.FIDed > 0) ? (text2 + (deviceRow.FIDed + 1) + "\t") : (text2 + "1\t"));
			int num = 0;
			int num2 = 0;
			myTag.AsyReadClear();
			while (true)
			{
				myTag.sw.WriteLine(text2);
				text3 = stringBuilder.ToString();
				int num3 = num;
				stringBuilder = new StringBuilder(524288);
				num = 0;
				while (true)
				{
					if (myTag.BW.CancellationPending)
					{
						throw new IOException();
					}
					string text4 = myTag.AsyReadLine();
					if (text4 == null)
					{
						throw new IOException();
					}
					string[] array = text4.Split('\t');
					if (array[0] == "END")
					{
						break;
					}
					stringBuilder.AppendLine(text4);
					if (array[0] == "RES")
					{
						num++;
						if (array.Length < 18)
						{
							string text5 = Program.GetLang("pw_ParseError") + ": RES in Ethernet items seg 18/" + text4.Length + ", " + text + ":" + text4;
							RDS.Log_Error(text5);
							UploadReport_Log_Error(text5 + "\r\n");
							flag = true;
							Directory.CreateDirectory(Application.StartupPath + "\\Report\\LogError");
							DateTime now = DateTime.Now;
							File.WriteAllText(Application.StartupPath + "\\Report\\LogError\\" + now.ToString("yyMMddHHmmss") + "_" + myTag.Mac + ".txt", stringBuilder.ToString(), Encoding.UTF8);
							throw new IOException();
						}
					}
					else if (array[0] == "REP" && array.Length < 10)
					{
						string text6 = Program.GetLang("pw_ParseError") + ": REP in Ethernet items seg 10/" + text4.Length + ", " + text + ":" + text4;
						RDS.Log_Error(text6);
						UploadReport_Log_Error(text6 + "\r\n");
						flag = true;
						Directory.CreateDirectory(Application.StartupPath + "\\Report\\LogError");
						DateTime now2 = DateTime.Now;
						File.WriteAllText(Application.StartupPath + "\\Report\\LogError\\" + now2.ToString("yyMMddHHmmss") + "_" + myTag.Mac + ".txt", stringBuilder.ToString(), Encoding.UTF8);
						throw new IOException();
					}
					if (num3 == 0)
					{
						ReportProgress(myTag, string.Format("{0} {1}", Program.GetLang("pw_Report"), num));
					}
					else
					{
						ReportProgress(myTag, string.Format("{0} {1}/{2}", Program.GetLang("pw_Report"), num, num3));
					}
				}
				myTag.sw.WriteLine("UPL\tEND\t");
				if ((num == num3 && stringBuilder.ToString() == text3) || (num > num3 && num3 > 0 && stringBuilder.ToString().Substring(0, text3.Length) == text3))
				{
					break;
				}
				num2++;
				if (num2 > 10)
				{
					throw new IOException();
				}
				Thread.Sleep(num2 * 100);
			}
			myTag.sw.WriteLine("UPL\tEND\t");
			ReportProgress(myTag, Program.GetLang("pw_UpdatingDatabase"));
		}
		catch (Exception)
		{
			if (!flag)
			{
				UploadReport_Log_Error(Program.GetLang("pw_Error_OperationFailed") + ": " + string.Format(Program.GetLang("pw_cInfo_SingleDevice"), myTag.Mac, myTag.IPP) + "\r\n");
			}
			return;
		}
		bool flag3 = false;
		while (!myTag.BW.CancellationPending && !flag3)
		{
			try
			{
				Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
				flag3 = true;
			}
			catch (ApplicationException)
			{
				ReportProgress(myTag, Program.GetLang("pw_Databaseisinuse_"));
			}
		}
		if (myTag.BW.CancellationPending)
		{
			if (flag3)
			{
				Program.reportLock.ReleaseWriterLock();
			}
			return;
		}
		try
		{
			string[] lines = text3.Split(new string[1] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries);
			if (RDS.NL_Log_Get(myTag.Mac, myTag.IPP, lines, out var error, out var success, string.Compare(myTag.nVersion, "V3.00A") < 0 || !Settings.Default.gen_CostFromDevice))
			{
				UploadReport_Log_Info(success);
				return;
			}
			UploadReport_Log_Error(error);
			Directory.CreateDirectory(Application.StartupPath + "\\Report\\LogError");
			DateTime now3 = DateTime.Now;
			File.WriteAllText(Application.StartupPath + "\\Report\\LogError\\" + now3.ToString("yyMMddHHmmss") + "_" + myTag.Mac + ".txt", text3, Encoding.UTF8);
		}
		catch (Exception ex3)
		{
			UploadReport_Log_Error(Program.GetLang("pw_ParseError") + ": " + ex3.Message + ',' + ex3.Source + ',' + string.Format(Program.GetLang("pw_cInfo_SingleDevice"), myTag.Mac, myTag.IPP));
		}
		finally
		{
			Program.reportLock.ReleaseWriterLock();
		}
	}

	private void UdpClientThread()
	{
		try
		{
			using (udpClient = new UdpClient())
			{
				udpClient.ExclusiveAddressUse = false;
				udpClient.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, optionValue: true);
				udpClient.Client.Bind(new IPEndPoint(IPAddress.Any, Settings.Default.udpRecvPort));
				IPEndPoint remoteEP = new IPEndPoint(IPAddress.Any, 0);
				while (true)
				{
					try
					{
						byte[] array = udpClient.Receive(ref remoteEP);
						if (array.Length == 0)
						{
							continue;
						}
						string text = Program.GetEncoding().GetString(array);
						int num = text.IndexOf("UDP");
						if (num < 0)
						{
							continue;
						}
						text = text.Substring(num);
						string[] array2 = text.Split('\t');
						if (array2.Length >= 3 && !(array2[0] != "UDP"))
						{
							int port = int.Parse(array2[1]);
							IPEndPoint iPEndPoint = new IPEndPoint(remoteEP.Address, port);
							if (!HasItem(iPEndPoint))
							{
								Thread thread = new Thread(UdpTcpClientThread);
								thread.Start(iPEndPoint);
							}
						}
					}
					catch
					{
					}
				}
			}
		}
		catch
		{
		}
	}

	private bool HasItem(IPEndPoint ip)
	{
		if (listView.InvokeRequired)
		{
			return (bool)Invoke(new HasItemCallback(HasItem), ip);
		}
		string b = ip.ToString();
		foreach (ListViewItem item in listView.Items)
		{
			if (string.Equals(item.SubItems[0].Text, b) || string.Equals(item.SubItems[9].Text, b))
			{
				return GetItemTag(item).LinkType != LinkType.TcpOffline;
			}
		}
		return false;
	}

	private void TcpServerThread()
	{
		try
		{
			tcpListener = new TcpListener(IPAddress.Any, Settings.Default.tcpServerPort);
			tcpListener.Start();
			while (true)
			{
				TcpClient client = tcpListener.AcceptTcpClient();
				AddLink(client, LinkType.TcpServer);
			}
		}
		catch
		{
		}
		finally
		{
			tcpListener.Stop();
		}
	}

	private void TcpClientThread(object obj)
	{
		if (!(obj is IPEndPoint remoteEP))
		{
			return;
		}
		TcpClient tcpClient = null;
		try
		{
			tcpClient = new TcpClient();
			tcpClient.Connect(remoteEP);
			AddLink(tcpClient, LinkType.TcpClient);
		}
		catch
		{
			tcpClient?.Close();
		}
	}

	private void UdpTcpClientThread(object obj)
	{
		if (!(obj is IPEndPoint iPEndPoint) || HasItem(iPEndPoint))
		{
			return;
		}
		TcpClient tcpClient = null;
		try
		{
			tcpClient = new TcpClient();
			tcpClient.Connect(iPEndPoint);
			AddLink(tcpClient, LinkType.UdpClient);
		}
		catch
		{
			tcpClient?.Close();
		}
	}

	private string GetMac(ListViewItem item)
	{
		return item.SubItems[8].Text;
	}

	private void AddLink(TcpClient client, LinkType type)
	{
		if (listView.InvokeRequired)
		{
			Invoke(new AddLinkCallback(AddLink), client, type);
			return;
		}
		client.ReceiveTimeout = recvTimeOut;
		client.SendTimeout = Settings.Default.sendTimeOut;
		IPEndPoint iPEndPoint = (IPEndPoint)client.Client.RemoteEndPoint;
		ListViewItem listViewItem = listView.FindItemWithText(iPEndPoint.ToString());
		if (listViewItem == null)
		{
			listViewItem = new ListViewItem(new string[11]
			{
				iPEndPoint.ToString(),
				string.Empty,
				string.Empty,
				string.Empty,
				string.Empty,
				GetTableTypeText_Un(),
				Program.GetLang("pw_Ready"),
				(listView.Items.Count + 1).ToString(),
				string.Empty,
				string.Empty,
				string.Empty
			}, GetLinkTypeImage(type));
			listViewItem.Tag = new MyTag(client, type, TableType.Unattached, this);
			listView.Items.Add(listViewItem);
			listViewItem.Selected = true;
		}
		else
		{
			if (GetItemTag(listViewItem).LinkType != LinkType.TcpOffline)
			{
				client.Close();
				return;
			}
			type = LinkType.TcpClient;
			listViewItem.ImageKey = GetLinkTypeImage(type);
			listViewItem.Tag = new MyTag(client, type, TableType.Unattached, this);
			listViewItem.SubItems[6].Text = Program.GetLang("pw_Ready");
		}
		((MyTag)listViewItem.Tag).Client_RW();
		BeginNetworkAction(listViewItem, NetworkAction.UploadInfo);
		UpdateUI();
	}

	private string MACmustChange(string mac)
	{
		string text = string.Format(Settings.Default.FXP_Offline, mac);
		if (mac == text)
		{
			text = "o-" + mac;
		}
		return text;
	}

	private void RemoveLink(ListViewItem item, bool bNotify, bool closing = false)
	{
		if (item == null)
		{
			return;
		}
		MyTag itemTag = GetItemTag(item);
		TcpClient client = itemTag.Client;
		if (bNotify)
		{
			string text = string.Format(Program.GetLang("pw_Device_0_hasbeendisconnectedfromthenetwork_"), client.Client.RemoteEndPoint.ToString());
			MessageBox.Show(this, text, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
		if (client != null)
		{
			if (client.Connected)
			{
				client.GetStream().Close();
			}
			client.Close();
		}
		LinkType linkType = itemTag.LinkType;
		if (linkType != LinkType.TcpOffline || closing)
		{
			if (linkType == LinkType.TcpClient)
			{
				itemTag.Client = null;
				itemTag.LinkType = LinkType.TcpOffline;
				item.ImageKey = GetLinkTypeImage(itemTag.LinkType);
				item.SubItems[1].Text = string.Format(Settings.Default.FXP_Offline, item.SubItems[1].Text);
				item.SubItems[2].Text = string.Format(Settings.Default.FXP_Offline, item.SubItems[2].Text);
				item.SubItems[3].Text = string.Format(Settings.Default.FXP_Offline, item.SubItems[3].Text);
				item.SubItems[4].Text = string.Format(Settings.Default.FXP_Offline, item.SubItems[4].Text);
				item.SubItems[8].Text = MACmustChange(item.SubItems[8].Text);
				item.SubItems[5].Text = GetTableTypeText_Un();
				item.SubItems[6].Text = Program.GetLang("pw_Offline");
				item.Checked = false;
				UpdateTableTypeText(item);
			}
			else
			{
				item.Remove();
			}
			string text2 = '★' + item.SubItems[1].Text + '★' + item.SubItems[2].Text + '★' + item.SubItems[3].Text;
			Program.mf.ShowBallonTip(Program.GetLang("pw_Offline"), item.SubItems[0].Text + "\r\n" + text2);
			if (itemTag.NetworkAction == NetworkAction.DownloadECS || itemTag.NetworkAction == NetworkAction.UploadECS)
			{
				ecsData_Log_Info(Program.GetLang("pw_Failed") + " :" + string.Format(Program.GetLang("pw_cInfo_SingleDevice"), item.SubItems[8].Text, item.SubItems[0].Text));
			}
			ecsData_Log_Info(Program.GetLang("pw_Offline") + " :" + string.Format(Program.GetLang("pw_cInfo_SingleDevice"), item.SubItems[8].Text, item.SubItems[0].Text));
			UpdateUI();
		}
	}

	private static void BroadCast()
	{
		try
		{
			using UdpClient udpClient = new UdpClient();
			udpClient.ExclusiveAddressUse = false;
			udpClient.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, optionValue: true);
			udpClient.Client.Bind(new IPEndPoint(IPAddress.Any, Settings.Default.udpRecvPort));
			byte[] bytes = Program.GetEncoding().GetBytes("UDP\t\r\n");
			udpClient.EnableBroadcast = true;
			if (Settings.Default.manualBroadcast)
			{
				IPAddress[] hostAddresses = Dns.GetHostAddresses(Dns.GetHostName());
				IPAddress[] array = hostAddresses;
				foreach (IPAddress iPAddress in array)
				{
					byte[] addressBytes = iPAddress.GetAddressBytes();
					int num = addressBytes[3];
					for (byte b = 1; b <= 254; b++)
					{
						if (b != num)
						{
							addressBytes[3] = b;
							IPEndPoint endPoint = new IPEndPoint(new IPAddress(addressBytes), Settings.Default.udpBroadcastPort);
							for (int j = 0; j < 5; j++)
							{
								udpClient.Send(bytes, bytes.Length, endPoint);
							}
						}
					}
				}
			}
			else
			{
				IPEndPoint endPoint2 = new IPEndPoint(IPAddress.Parse(Settings.Default.udpBroadIP), Settings.Default.udpBroadcastPort);
				for (int k = 0; k < 5; k++)
				{
					udpClient.Send(bytes, bytes.Length, endPoint2);
				}
			}
		}
		catch (Exception)
		{
		}
	}

	private static string GetLinkTypeImage(LinkType type)
	{
		return type switch
		{
			LinkType.TcpOffline => "Flag_gray", 
			LinkType.TcpClient => "Flag_blue", 
			LinkType.TcpServer => "Flag_red", 
			LinkType.UdpClient => "Flag_green", 
			_ => throw new InvalidOperationException(), 
		};
	}

	private void UpdateTableTypeText(ListViewItem item)
	{
		MyTag itemTag = GetItemTag(item);
		if (item.SubItems[8].Text.Length == 0)
		{
			item.SubItems[5].Text = Program.GetLang("pw_Unattached");
			itemTag.TableType = TableType.Unattached;
			return;
		}
		ReportDataSet.DeviceRow deviceRow = RDS.reportDataSet.Device.FindByMAC(item.SubItems[8].Text);
		if (deviceRow == null)
		{
			item.SubItems[5].Text = Program.GetLang("pw_Unattached");
			itemTag.TableType = TableType.Unattached;
			return;
		}
		ReportDataSet.SGroupRow sGroupRow = RDS.reportDataSet.SGroup.FindByGID(deviceRow.GID);
		if (sGroupRow == null)
		{
			item.SubItems[5].Text = Program.GetLang("pw_Unattached");
			itemTag.TableType = TableType.Unattached;
		}
		else
		{
			item.SubItems[5].Text = sGroupRow.GID + " - " + sGroupRow.Name;
			itemTag.TableType = TableType.Attached;
		}
	}

	private string GetTableTypeText_Un()
	{
		return Program.GetLang("pw_Unattached");
	}

	private static MyTag GetItemTag(ListViewItem item)
	{
		if (item == null)
		{
			return null;
		}
		return item.Tag as MyTag;
	}

	private ListViewItem GetCurrentItem()
	{
		if (listView.SelectedItems.Count < 1)
		{
			return null;
		}
		return listView.SelectedItems[0];
	}

	private void shutToolStripButton_Click(object sender, EventArgs e)
	{
		ListViewItem currentItem = GetCurrentItem();
		if (currentItem != null)
		{
			RemoveLink(currentItem, bNotify: false);
		}
	}

	private void addToolStripButton_Click(object sender, EventArgs e)
	{
		IPEndPoint iPEndPoint = null;
		using (AddressForm addressForm = new AddressForm())
		{
			if (addressForm.ShowDialog(this) != DialogResult.OK)
			{
				return;
			}
			iPEndPoint = addressForm.Address;
			if (iPEndPoint.Address == IPAddress.None)
			{
				return;
			}
		}
		foreach (ListViewItem item in listView.Items)
		{
			if (item.SubItems[0].Text == iPEndPoint.ToString())
			{
				MyTag itemTag = GetItemTag(item);
				if (itemTag.LinkType == LinkType.UdpClient)
				{
					itemTag.LinkType = LinkType.TcpClient;
					item.ImageKey = GetLinkTypeImage(LinkType.TcpClient);
				}
				return;
			}
		}
		ListViewItem listViewItem2 = new ListViewItem(new string[10]
		{
			iPEndPoint.ToString(),
			string.Empty,
			string.Empty,
			string.Empty,
			string.Empty,
			GetTableTypeText_Un(),
			Program.GetLang("pw_Offline"),
			(listView.Items.Count + 1).ToString(),
			string.Empty,
			string.Empty
		}, GetLinkTypeImage(LinkType.TcpOffline));
		listViewItem2.Tag = new MyTag(null, LinkType.TcpOffline, TableType.Unattached, this);
		listView.Items.Add(listViewItem2);
		Thread thread = new Thread(TcpClientThread);
		thread.Start(iPEndPoint);
		UpdateUI();
	}

	private void deleteToolStripButton_Click(object sender, EventArgs e)
	{
		ListViewItem currentItem = GetCurrentItem();
		if (currentItem == null)
		{
			return;
		}
		MyTag itemTag = GetItemTag(currentItem);
		if (itemTag.LinkType == LinkType.TcpServer || itemTag.LinkType == LinkType.UdpClient)
		{
			throw new InvalidOperationException();
		}
		TcpClient client = itemTag.Client;
		if (client != null)
		{
			if (client.Connected)
			{
				client.GetStream().Close();
			}
			client.Close();
		}
		currentItem.Remove();
		UpdateUI();
	}

	private void findToolStripButton_Click(object sender, EventArgs e)
	{
		BroadCast();
		foreach (ListViewItem item in listView.Items)
		{
			MyTag itemTag = GetItemTag(item);
			if (itemTag.LinkType == LinkType.TcpOffline)
			{
				string[] array = item.Text.Split(':');
				if (array.Length == 2)
				{
					int port;
					IPAddress address;
					try
					{
						port = int.Parse(array[1]);
						address = IPAddress.Parse(array[0]);
					}
					catch
					{
						continue;
					}
					IPEndPoint parameter = new IPEndPoint(address, port);
					Thread thread = new Thread(TcpClientThread);
					thread.Start(parameter);
				}
			}
			else
			{
				TcpClient client = itemTag.Client;
				if (client != null)
				{
					BeginNetworkAction(item, NetworkAction.UploadTime);
				}
			}
		}
	}

	private void repAllButton_Click(object sender, EventArgs e)
	{
		foreach (ListViewItem item in listView.Items)
		{
			MyTag itemTag = GetItemTag(item);
			if (itemTag != null && itemTag.TableType == TableType.Attached)
			{
				BeginNetworkAction(item, NetworkAction.UploadReport, new object[2]
				{
					GetMac(item),
					reCheckBox.Checked
				});
			}
		}
	}

	private void repButton_Click(object sender, EventArgs e)
	{
		ListViewItem currentItem = GetCurrentItem();
		if (currentItem != null)
		{
			BeginNetworkAction(currentItem, NetworkAction.UploadReport, new object[2]
			{
				GetMac(currentItem),
				reCheckBox.Checked
			});
		}
	}

	private void exeButton_Click(object sender, EventArgs e)
	{
		Program.mf.MainForm_Save();
		if (saveButton.Checked)
		{
			if (specCheckBox.Checked)
			{
				specTableAdapter.ClearBeforeFill = true;
				specTableAdapter.Fill(ecsDataSet.Spec);
			}
			if (stringCheckBox.Checked)
			{
				stringTableAdapter.ClearBeforeFill = true;
				stringTableAdapter.Fill(ecsDataSet.String);
			}
			if (faceCheckBox.Checked)
			{
				object selectedValue = faceListComboBox.SelectedValue;
				ecsDataSet.Face.Clear();
				ecsDataSet.FaceList.Clear();
				faceListTableAdapter.Fill(ecsDataSet.FaceList);
				faceTableAdapter.Fill(ecsDataSet.Face);
				faceListComboBox.SelectedValue = selectedValue;
			}
			if (deptCheckBox.Checked)
			{
				deptTableAdapter.ClearBeforeFill = true;
				deptTableAdapter.Fill(ecsDataSet.Dept);
			}
			if (classCheckBox.Checked)
			{
				classTableAdapter.ClearBeforeFill = true;
				classTableAdapter.Fill(ecsDataSet.Class);
			}
			if (barcodeCheckBox.Checked)
			{
				barcodeTableAdapter.ClearBeforeFill = true;
				barcodeTableAdapter.Fill(ecsDataSet.Barcode);
			}
			if (labelCheckBox.Checked)
			{
				ecsDataSet.LabelItem.Clear();
				ecsDataSet.Label.Clear();
				labelTableAdapter.Fill(ecsDataSet.Label);
				labelItemTableAdapter.Fill(ecsDataSet.LabelItem);
			}
			if (salesmanCheckBox.Checked)
			{
				salesmanTableAdapter.ClearBeforeFill = true;
				salesmanTableAdapter.Fill(ecsDataSet.Salesman);
			}
			if (vipCheckBox.Checked)
			{
				vipTableAdapter.ClearBeforeFill = true;
				vipTableAdapter.Fill(ecsDataSet.VIP);
			}
			if (custom1CheckBox.Checked)
			{
				custom1TableAdapter.ClearBeforeFill = true;
				custom1TableAdapter.Fill(ecsDataSet.Custom1);
			}
			if (custom2CheckBox.Checked)
			{
				custom2TableAdapter.ClearBeforeFill = true;
				custom2TableAdapter.Fill(ecsDataSet.Custom2);
			}
			if (custom3CheckBox.Checked)
			{
				custom3TableAdapter.ClearBeforeFill = true;
				custom3TableAdapter.Fill(ecsDataSet.Custom3);
			}
			if (custom4CheckBox.Checked)
			{
				custom4TableAdapter.ClearBeforeFill = true;
				custom4TableAdapter.Fill(ecsDataSet.Custom4);
			}
			if (bmpCheckBox.Checked)
			{
				List<SinglePicture> lsp = new List<SinglePicture>();
				BitmapFuc.DataSet_Bitmap_Load(ref lsp, ref ecsDataSet);
			}
			if (listView.CheckedItems.Count > 0)
			{
				ecsData_Log_Info(Program.GetLang("pw_Download") + " :" + string.Format(Program.GetLang("pw_cInfo_MultiDevice"), listView.CheckedItems.Count));
				{
					foreach (ListViewItem checkedItem in listView.CheckedItems)
					{
						BeginNetworkAction(checkedItem, NetworkAction.DownloadECS);
					}
					return;
				}
			}
			ListViewItem currentItem = GetCurrentItem();
			if (currentItem != null && ((MyTag)currentItem.Tag).LinkType != LinkType.TcpOffline)
			{
				ecsData_Log_Info(Program.GetLang("pw_Download") + " :" + string.Format(Program.GetLang("pw_cInfo_MultiDevice"), 1));
				BeginNetworkAction(currentItem, NetworkAction.DownloadECS);
			}
		}
		else if (openButton.Checked)
		{
			ListViewItem currentItem2 = GetCurrentItem();
			if (currentItem2 != null)
			{
				ecsData_Log_Info(Program.GetLang("pw_Upload") + " :" + string.Format(Program.GetLang("pw_cInfo_MultiDevice"), 1));
				BeginNetworkAction(currentItem2, NetworkAction.UploadECS);
			}
		}
	}

	private void timeToolStripButton_Click(object sender, EventArgs e)
	{
	}

	private void listView_SelectedIndexChanged(object sender, EventArgs e)
	{
		UpdateUI();
	}

	private void listView_ItemChecked(object sender, ItemCheckedEventArgs e)
	{
		UpdateUI();
	}

	private void UpdateUI()
	{
		int count = listView.CheckedItems.Count;
		ToolStripButton toolStripButton = timeToolStripButton;
		Button button = txtExebutton;
		bool flag = (excelExebutton.Enabled = count > 0);
		bool enabled = (button.Enabled = flag);
		toolStripButton.Enabled = enabled;
		if (count <= 0)
		{
			saveButton.Checked = false;
		}
		txtexeButtonCheck();
		ListViewItem currentItem = GetCurrentItem();
		if (currentItem == null || currentItem.SubItems[3].Text.Length == 0 || currentItem.SubItems[4].Text.Length == 0)
		{
			ToolStripButton mAC_ToolStripButton = MAC_ToolStripButton;
			bool visible = (MACr_ToolStripButton.Visible = false);
			mAC_ToolStripButton.Visible = visible;
			Button button2 = repButton;
			bool enabled2 = (specifyStock_Button.Enabled = false);
			button2.Enabled = enabled2;
			if (currentItem != null)
			{
				MyTag itemTag = GetItemTag(currentItem);
				LinkType linkType = itemTag.LinkType;
				deleteToolStripButton.Enabled = linkType == LinkType.TcpOffline || linkType == LinkType.TcpClient;
			}
			else
			{
				deleteToolStripButton.Enabled = false;
			}
			shutToolStripButton.Enabled = false;
			cancelToolStripButton.Enabled = false;
			RadioButton radioButton = openButton;
			bool enabled3 = (openButton.Checked = false);
			radioButton.Enabled = enabled3;
			repButton.Enabled = false;
		}
		else
		{
			MyTag itemTag2 = GetItemTag(currentItem);
			LinkType linkType2 = itemTag2.LinkType;
			MAC_ToolStripButton.Visible = currentItem.SubItems[8].Text == "000000000000";
			MACr_ToolStripButton.Visible = false;
			if (Program.right == Program.Right.SuperAdmin)
			{
				MAC_ToolStripButton.Visible = true;
			}
			specifyStock_Button.Enabled = itemTag2.TableType == TableType.Unattached;
			repButton.Enabled = itemTag2.TableType == TableType.Attached;
			if (itemTag2.NetworkAction != NetworkAction.None)
			{
				ToolStripButton mAC_ToolStripButton2 = MAC_ToolStripButton;
				bool enabled4 = (MACr_ToolStripButton.Enabled = false);
				mAC_ToolStripButton2.Enabled = enabled4;
				cancelToolStripButton.Enabled = true;
				deleteToolStripButton.Enabled = false;
				if (itemTag2.NetworkAction != NetworkAction.UploadTime)
				{
					shutToolStripButton.Enabled = false;
				}
				else
				{
					shutToolStripButton.Enabled = linkType2 != LinkType.TcpOffline;
				}
				RadioButton radioButton2 = openButton;
				bool enabled5 = (openButton.Checked = false);
				radioButton2.Enabled = enabled5;
				repButton.Enabled = false;
			}
			else
			{
				ToolStripButton mAC_ToolStripButton3 = MAC_ToolStripButton;
				bool enabled6 = (MACr_ToolStripButton.Enabled = true);
				mAC_ToolStripButton3.Enabled = enabled6;
				cancelToolStripButton.Enabled = false;
				deleteToolStripButton.Enabled = linkType2 == LinkType.TcpOffline || linkType2 == LinkType.TcpClient;
				shutToolStripButton.Enabled = linkType2 != LinkType.TcpOffline;
				openButton.Enabled = linkType2 != LinkType.TcpOffline;
				if (!openButton.Enabled)
				{
					openButton.Checked = false;
				}
				repButton.Enabled = itemTag2.TableType == TableType.Attached;
			}
		}
		ItemDefaultEnable_Change();
		exeButton.Enabled = saveButton.Checked || openButton.Checked;
		listView_LineNum();
	}

	private void selAllCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		if (specCheckBox.Enabled)
		{
			specCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (stringCheckBox.Enabled)
		{
			stringCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (faceCheckBox.Enabled)
		{
			faceCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (deptCheckBox.Enabled)
		{
			deptCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (classCheckBox.Enabled)
		{
			classCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (pLUCheckBox.Enabled)
		{
			pLUCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (labelCheckBox.Enabled)
		{
			labelCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (unitCheckBox.Enabled)
		{
			unitCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (barcodeCheckBox.Enabled)
		{
			barcodeCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (salesmanCheckBox.Enabled)
		{
			salesmanCheckBox.Checked = selAllCheckBox.Checked;
		}
		if (custom1CheckBox.Enabled && custom1CheckBox.Visible)
		{
			custom1CheckBox.Checked = selAllCheckBox.Checked;
		}
		if (custom2CheckBox.Enabled && custom2CheckBox.Visible)
		{
			custom2CheckBox.Checked = selAllCheckBox.Checked;
		}
		if (custom3CheckBox.Enabled && custom3CheckBox.Visible)
		{
			custom3CheckBox.Checked = selAllCheckBox.Checked;
		}
		if (custom4CheckBox.Enabled && custom4CheckBox.Visible)
		{
			custom4CheckBox.Checked = selAllCheckBox.Checked;
		}
		if (!selAllCheckBox.Checked)
		{
			CheckBox checkBox = vipCheckBox;
			CheckBox checkBox2 = fontCheckBox;
			CheckBox checkBox3 = bmpCheckBox;
			CheckBox checkBox4 = upgradeCheckBox;
			bool flag = (tMSCheckBox.Checked = false);
			bool flag3 = (checkBox4.Checked = flag);
			bool flag5 = (checkBox3.Checked = flag3);
			bool flag7 = (checkBox2.Checked = flag5);
			checkBox.Checked = flag7;
		}
		ItemDefaultEnable_Change();
	}

	private void cancelToolStripButton_Click(object sender, EventArgs e)
	{
		ListViewItem currentItem = GetCurrentItem();
		if (currentItem != null)
		{
			MyTag itemTag = GetItemTag(currentItem);
			if (itemTag.BW.IsBusy)
			{
				itemTag.BW.CancelAsync();
			}
		}
	}

	private bool FK_DeviceAdd(MyTag myTag, string deviceName, string mac, int ctGID, string ctString)
	{
		bool flag = false;
		if (myTag == null)
		{
			try
			{
				Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
			}
			catch (ApplicationException)
			{
				return false;
			}
		}
		else
		{
			while (!myTag.BW.CancellationPending && !flag)
			{
				try
				{
					Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
					flag = true;
				}
				catch (ApplicationException)
				{
					ReportProgress(myTag, Program.GetLang("pw_Databaseisinuse_"));
				}
			}
			if (myTag.BW.CancellationPending)
			{
				if (flag)
				{
					Program.reportLock.ReleaseWriterLock();
				}
				return false;
			}
		}
		try
		{
			RDS.NL_DeviceAdd(deviceName, mac, ctGID, ctString);
		}
		finally
		{
			Program.reportLock.ReleaseWriterLock();
		}
		return true;
	}

	private void showButton_Click(object sender, EventArgs e)
	{
		Program.mf.PopMdiChild("report");
	}

	private void selAllToolStripButton_Click(object sender, EventArgs e)
	{
		selAllToolStripButton.Checked = !selAllToolStripButton.Checked;
		foreach (ListViewItem item in listView.Items)
		{
			item.Checked = selAllToolStripButton.Checked;
		}
	}

	private void saveButton_CheckedChanged(object sender, EventArgs e)
	{
		ItemDefaultEnable_Change();
		exeButton.Enabled = saveButton.Checked || openButton.Checked;
		vipPointCheckBox.Enabled = vipCheckBox.Checked && saveButton.Checked;
		if (custom1CheckBox.Visible && custom1Row != null)
		{
			custom1CheckBox.Enabled = (saveButton.Checked ? custom1Row.Export : custom1Row.Import);
			if (!custom1CheckBox.Enabled)
			{
				custom1CheckBox.Checked = false;
			}
		}
		if (custom2CheckBox.Visible && custom2Row != null)
		{
			custom2CheckBox.Enabled = (saveButton.Checked ? custom2Row.Export : custom2Row.Import);
			if (!custom2CheckBox.Enabled)
			{
				custom2CheckBox.Checked = false;
			}
		}
		if (custom3CheckBox.Visible && custom3Row != null)
		{
			custom3CheckBox.Enabled = (saveButton.Checked ? custom3Row.Export : custom3Row.Import);
			if (!custom3CheckBox.Enabled)
			{
				custom3CheckBox.Checked = false;
			}
		}
		if (custom4CheckBox.Visible && custom4Row != null)
		{
			custom4CheckBox.Enabled = (saveButton.Checked ? custom4Row.Export : custom4Row.Import);
			if (!custom4CheckBox.Enabled)
			{
				custom4CheckBox.Checked = false;
			}
		}
	}

	private void uploadButton_Click(object sender, EventArgs e)
	{
		if (webClient.IsBusy)
		{
			return;
		}
		string text = Application.StartupPath + "\\" + fileComboBox.Text;
		if (File.Exists(text))
		{
			try
			{
				Program.GetRWLock(fileComboBox.Text).AcquireReaderLock(0);
			}
			catch (ApplicationException)
			{
				progressLabel.Text = Program.GetLang("pw_Databaseisinuse_");
				return;
			}
			if (logCheckBox.Checked)
			{
				webClient.Credentials = new NetworkCredential(usernameTextBox.Text, passwordTextBox.Text);
			}
			try
			{
				Uri address = new Uri(new Uri(uriTextBox.Text), fileComboBox.Text);
				webClient.UploadFileAsync(address, text);
			}
			catch (Exception ex2)
			{
				Program.GetRWLock(fileComboBox.Text).ReleaseReaderLock();
				progressLabel.Text = ex2.Message;
				return;
			}
			cancelButton.Enabled = true;
			Button button = downloadButton;
			bool enabled = (uploadButton.Enabled = false);
			button.Enabled = enabled;
		}
	}

	private void downloadButton_Click(object sender, EventArgs e)
	{
		if (!webClient.IsBusy)
		{
			string fileName = Application.StartupPath + "\\" + fileComboBox.Text + ".tmp";
			try
			{
				Program.GetRWLock(fileComboBox.Text).AcquireWriterLock(0);
			}
			catch (ApplicationException)
			{
				progressLabel.Text = Program.GetLang("pw_Databaseisinuse_");
				return;
			}
			if (logCheckBox.Checked)
			{
				webClient.Credentials = new NetworkCredential(usernameTextBox.Text, passwordTextBox.Text);
			}
			try
			{
				Uri address = new Uri(new Uri(uriTextBox.Text), fileComboBox.Text);
				webClient.DownloadFileAsync(address, fileName);
			}
			catch (Exception ex2)
			{
				Program.GetRWLock(fileComboBox.Text).ReleaseWriterLock();
				progressLabel.Text = ex2.Message;
				return;
			}
			cancelButton.Enabled = true;
			Button button = downloadButton;
			bool enabled = (uploadButton.Enabled = false);
			button.Enabled = enabled;
		}
	}

	private void cancelButton_Click(object sender, EventArgs e)
	{
		if (webClient.IsBusy)
		{
			webClient.CancelAsync();
		}
	}

	private void webClient_DownloadFileCompleted(object sender, AsyncCompletedEventArgs e)
	{
		try
		{
			string text = Application.StartupPath + "\\" + fileComboBox.Text + ".tmp";
			if (!File.Exists(text))
			{
				return;
			}
			if (e.Cancelled)
			{
				File.Delete(text);
				progressLabel.Text = Program.GetLang("pw_Cancelled");
				return;
			}
			if (e.Error != null)
			{
				progressLabel.Text = e.Error.Message;
				return;
			}
			progressLabel.Text = Program.GetLang("pw_Ready");
			string text2 = Application.StartupPath + "\\" + fileComboBox.Text;
			if (File.Exists(text2))
			{
				File.Delete(text2);
			}
			File.Move(text, text2);
		}
		finally
		{
			cancelButton.Enabled = false;
			Button button = downloadButton;
			bool enabled = (uploadButton.Enabled = true);
			button.Enabled = enabled;
			Program.GetRWLock(fileComboBox.Text).ReleaseWriterLock();
		}
	}

	private void webClient_UploadFileCompleted(object sender, UploadFileCompletedEventArgs e)
	{
		try
		{
			if (e.Cancelled)
			{
				progressLabel.Text = Program.GetLang("pw_Cancelled");
			}
			else if (e.Error != null)
			{
				progressLabel.Text = e.Error.Message;
			}
			else
			{
				progressLabel.Text = Program.GetLang("pw_Ready");
			}
		}
		finally
		{
			cancelButton.Enabled = false;
			Button button = downloadButton;
			bool enabled = (uploadButton.Enabled = true);
			button.Enabled = enabled;
			Program.GetRWLock(fileComboBox.Text).ReleaseReaderLock();
		}
	}

	private void webClient_DownloadProgressChanged(object sender, DownloadProgressChangedEventArgs e)
	{
		progressLabel.Text = $"{e.BytesReceived} / {e.TotalBytesToReceive}";
		progressBar.Value = e.ProgressPercentage;
	}

	private void webClient_UploadProgressChanged(object sender, UploadProgressChangedEventArgs e)
	{
		progressLabel.Text = $"{e.BytesSent} / {e.TotalBytesToSend}";
		progressBar.Value = e.ProgressPercentage;
	}

	private void logCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		TextBox textBox = usernameTextBox;
		bool enabled = (passwordTextBox.Enabled = logCheckBox.Checked);
		textBox.Enabled = enabled;
	}

	private void taskToolStripButton_Click(object sender, EventArgs e)
	{
		DestroyTimers();
		using (AutoTaskForm autoTaskForm = new AutoTaskForm())
		{
			autoTaskForm.ShowDialog(this);
		}
		string text = Application.StartupPath + "\\AutoTask.xml";
		if (File.Exists(text))
		{
			uiDataSet.Network_Auto.Clear();
			uiDataSet.Network_Auto.ReadXml(text);
			CreateTimers();
		}
	}

	private void CreateTimers()
	{
		foreach (UIDataSet.Network_AutoRow item2 in uiDataSet.Network_Auto)
		{
			if (item2.Due == 2)
			{
				continue;
			}
			TimeSpan timeSpan = (item2.Repeat ? new TimeSpan(item2.Day, item2.Hour, item2.Minute, item2.Second) : TimeSpan.Zero);
			TimeSpan timeSpan2 = ((item2.Due == 0) ? timeSpan : (item2.DateTime - DateTime.Now));
			if (timeSpan2 < TimeSpan.Zero)
			{
				if (!item2.Repeat)
				{
					continue;
				}
				int num = -(int)(timeSpan2.TotalSeconds / timeSpan.TotalSeconds);
				timeSpan2 += TimeSpan.FromSeconds(timeSpan.TotalSeconds * (double)num);
				for (; timeSpan2 < TimeSpan.Zero; timeSpan2 += timeSpan)
				{
				}
			}
			System.Threading.Timer item = new System.Threading.Timer(AutoTaskCallback, item2, timeSpan2, timeSpan);
			timers.Add(item);
		}
	}

	private void DestroyTimers()
	{
		if (timers.Count <= 0)
		{
			return;
		}
		foreach (System.Threading.Timer timer in timers)
		{
			timer.Dispose();
		}
		timers.Clear();
	}

	private void NetworkActionAll(NetworkAction networkAction)
	{
		if (base.InvokeRequired)
		{
			Invoke(new NetworkActionAllCallback(NetworkActionAll), networkAction);
			return;
		}
		foreach (ListViewItem item in listView.Items)
		{
			if (item.SubItems[1].Text.Length != 0 && item.SubItems[2].Text.Length != 0 && item.SubItems[3].Text.Length != 0 && item.SubItems[4].Text.Length != 0)
			{
				MyTag itemTag = GetItemTag(item);
				if (itemTag != null)
				{
					BeginNetworkAction(item, networkAction);
				}
			}
		}
	}

	private void AutoTaskCallback(object state)
	{
		UIDataSet.Network_AutoRow network_AutoRow = (UIDataSet.Network_AutoRow)state;
		NetworkAction task = (NetworkAction)network_AutoRow.Task;
		switch (task)
		{
		case NetworkAction.DownloadMdb:
		{
			using WebClient webClient2 = new WebClient();
			string text = Application.StartupPath + "\\" + network_AutoRow.File + ".tmp";
			try
			{
				Program.GetRWLock(network_AutoRow.File).AcquireWriterLock(-1);
				if (network_AutoRow.Login)
				{
					webClient2.Credentials = new NetworkCredential(network_AutoRow.User, network_AutoRow.Password);
				}
				Uri address2 = new Uri(new Uri(network_AutoRow.Uri), network_AutoRow.File);
				webClient2.DownloadFile(address2, text);
				string text2 = Application.StartupPath + "\\" + network_AutoRow.File;
				if (File.Exists(text2))
				{
					File.Delete(text2);
				}
				File.Move(text, text2);
				break;
			}
			catch
			{
				break;
			}
			finally
			{
				Program.GetRWLock(network_AutoRow.File).ReleaseWriterLock();
			}
		}
		case NetworkAction.UploadMdb:
		{
			using WebClient webClient = new WebClient();
			try
			{
				Program.GetRWLock(network_AutoRow.File).AcquireReaderLock(-1);
				string fileName = Application.StartupPath + "\\" + network_AutoRow.File;
				if (network_AutoRow.Login)
				{
					webClient.Credentials = new NetworkCredential(network_AutoRow.User, network_AutoRow.Password);
				}
				Uri address = new Uri(new Uri(network_AutoRow.Uri), network_AutoRow.File);
				webClient.UploadFile(address, fileName);
				break;
			}
			catch
			{
				break;
			}
			finally
			{
				Program.GetRWLock(network_AutoRow.File).ReleaseReaderLock();
			}
		}
		default:
			NetworkActionAll(task);
			break;
		}
	}

	private void FindCustom()
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

	private void SaveCustom(StreamWriter sw, UIDataSet.CustomRow row, MyTag myTag)
	{
		string keyword = row.Keyword;
		DataTable dataTable = ecsDataSet.Tables[row._Table];
		if (clearCheckBox.Checked)
		{
			sw.WriteLine($"CLR\t{keyword}\t");
			sw.WriteLine("CLR\tEND\t");
		}
		sw.WriteLine($"DWL\t{keyword}\t");
		int count = dataTable.Rows.Count;
		for (int i = 0; i < count; i++)
		{
			if (myTag.BW.CancellationPending)
			{
				break;
			}
			DataRow dataRow = dataTable.Rows[i];
			sw.Write($"{keyword}\t");
			UIDataSet.CustomItemRow[] customItemRows = row.GetCustomItemRows();
			foreach (UIDataSet.CustomItemRow customItemRow in customItemRows)
			{
				if (!(customItemRow.Field == "NULL"))
				{
					object obj = dataRow[customItemRow.Field];
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
			sw.Flush();
			ReportProgress(myTag, $"{row.Display} {i + 1} / {count} ({(i + 1) * 100 / count}%)");
		}
		sw.WriteLine($"END\t{keyword}\t");
		sw.Flush();
	}

	private void OpenCustom(ECSDataSet ecsNewSet, StreamWriter sw, StreamReader sr, UIDataSet.CustomRow row, MyTag myTag)
	{
		string keyword = row.Keyword;
		DataTable dataTable = ecsNewSet.Tables[row._Table];
		sw.WriteLine($"UPL\t{keyword}\t");
		int num = 0;
		while (!myTag.BW.CancellationPending)
		{
			string text = myTag.AsyReadLine();
			if (text == null)
			{
				throw new IOException();
			}
			string[] array = text.Split('\t');
			if (array[0] == "END")
			{
				break;
			}
			if (array[0] != keyword)
			{
				continue;
			}
			num++;
			ReportProgress(myTag, $"{row.Display} {num}");
			DataRow dataRow = dataTable.NewRow();
			try
			{
				UIDataSet.CustomItemRow[] customItemRows = row.GetCustomItemRows();
				int num2;
				for (int i = (num2 = 0); i < customItemRows.Length; i++)
				{
					string field = customItemRows[i].Field;
					if (!(field == "NULL"))
					{
						if (dataRow[field].GetType() == typeof(int))
						{
							dataRow[field] = Program.ParseInt(array[num2 + 1]);
						}
						else if (dataRow[field].GetType() == typeof(string))
						{
							dataRow[field] = Program.ParseString(array[num2 + 1]);
						}
						else if (dataRow[field].GetType() == typeof(decimal))
						{
							dataRow[field] = Program.ParseDecimal(array[num2 + 1]);
						}
						num2++;
					}
				}
			}
			catch (IndexOutOfRangeException)
			{
			}
			dataTable.Rows.Add(dataRow);
		}
		sw.WriteLine("UPL\tEND\t");
	}

	private void InitCustom()
	{
		FindCustom();
		if (custom1Row == null)
		{
			custom1CheckBox.Visible = false;
		}
		else
		{
			custom1CheckBox.Visible = custom1Row.Visible;
			custom1CheckBox.Text = custom1Row.Display;
		}
		if (custom2Row == null)
		{
			custom2CheckBox.Visible = false;
		}
		else
		{
			custom2CheckBox.Visible = custom2Row.Visible;
			custom2CheckBox.Text = custom2Row.Display;
		}
		if (custom3Row == null)
		{
			custom3CheckBox.Visible = false;
		}
		else
		{
			custom3CheckBox.Visible = custom3Row.Visible;
			custom3CheckBox.Text = custom3Row.Display;
		}
		if (custom4Row == null)
		{
			custom4CheckBox.Visible = false;
			return;
		}
		custom4CheckBox.Visible = custom4Row.Visible;
		custom4CheckBox.Text = custom4Row.Display;
	}

	private void listView_ColumnClick(object sender, ColumnClickEventArgs e)
	{
		if (e.Column == 7)
		{
			return;
		}
		if (e.Column == lvwColumnSorter.SortColumn)
		{
			if (lvwColumnSorter.Order == SortOrder.Ascending)
			{
				lvwColumnSorter.Order = SortOrder.Descending;
			}
			else
			{
				lvwColumnSorter.Order = SortOrder.Ascending;
			}
		}
		else
		{
			lvwColumnSorter.SortColumn = e.Column;
			lvwColumnSorter.Order = SortOrder.Ascending;
		}
		listView.ListViewItemSorter = lvwColumnSorter;
		listView.Sort();
		listView.ListViewItemSorter = null;
		listView_LineNum();
	}

	private void upgradebrowseButton_Click(object sender, EventArgs e)
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.CheckFileExists = true;
		openFileDialog.Filter = Program.GetLang("pw_BINFile___bin____bin_AllFile_________");
		openFileDialog.FileName = upgradeFileBox.Text;
		if (openFileDialog.ShowDialog(this) == DialogResult.OK)
		{
			upgradeFileBox.Text = openFileDialog.FileName;
		}
	}

	private void tMSbrowseButton_Click(object sender, EventArgs e)
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.CheckFileExists = true;
		openFileDialog.Filter = Program.GetLang("pw_TMSFile___TMS____tms_AllFile_________");
		openFileDialog.FileName = tMSFileBox.Text;
		if (openFileDialog.ShowDialog(this) == DialogResult.OK)
		{
			tMSFileBox.Text = openFileDialog.FileName;
		}
	}

	private void upgradeCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		TextBox textBox = upgradeFileBox;
		bool enabled = (upgradebrowseButton.Enabled = upgradeCheckBox.Checked);
		textBox.Enabled = enabled;
	}

	private void tMSCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		TextBox textBox = tMSFileBox;
		bool enabled = (tMSbrowseButton.Enabled = tMSCheckBox.Checked);
		textBox.Enabled = enabled;
	}

	public void HoldToDownload(bool Wizard, bool Spec, bool String, bool Barcode, bool Label, bool PLU, bool Face, bool Dept, bool Class, bool Unit, bool Salesman, bool SP1, bool SP2, bool SP3, bool SP4, bool VIP = false, bool Bitmap = false)
	{
		faceListComboBox.SelectedValue = Settings.Default.ScFile_ScaleID;
		tabControl.SelectedTab = ecsTabPage;
		saveButton.Checked = true;
		faceCheckBox.Checked = Face;
		deptCheckBox.Checked = Dept;
		classCheckBox.Checked = Class;
		pLUCheckBox.Checked = PLU;
		unitCheckBox.Checked = false;
		salesmanCheckBox.Checked = Salesman;
		specCheckBox.Checked = Spec;
		stringCheckBox.Checked = String;
		labelCheckBox.Checked = Label;
		barcodeCheckBox.Checked = Barcode;
		custom1CheckBox.Checked = SP1;
		custom2CheckBox.Checked = SP2;
		custom3CheckBox.Checked = SP3;
		custom4CheckBox.Checked = SP4;
		vipCheckBox.Checked = VIP;
		bmpCheckBox.Checked = Bitmap;
		if (mf_Docked)
		{
			expand_Button_Click(null, null);
		}
		if (Wizard)
		{
			wizardCheckBox.Visible = true;
			wizardCheckBox.Checked = true;
			ItemDefaultEnable();
			if (Spec)
			{
				specCheckBox.Enabled = false;
			}
			if (String)
			{
				stringCheckBox.Enabled = false;
			}
			if (Face)
			{
				faceCheckBox.Enabled = false;
			}
			if (Dept)
			{
				deptCheckBox.Enabled = false;
			}
			if (Class)
			{
				classCheckBox.Enabled = false;
			}
			if (PLU)
			{
				pLUCheckBox.Enabled = false;
			}
			if (Label)
			{
				labelCheckBox.Enabled = false;
			}
			if (Barcode)
			{
				barcodeCheckBox.Enabled = false;
			}
			if (Salesman)
			{
				salesmanCheckBox.Enabled = false;
			}
			if (VIP)
			{
				vipCheckBox.Enabled = false;
			}
			if (Bitmap)
			{
				bmpCheckBox.Enabled = false;
			}
		}
		else
		{
			wizardCheckBox.Checked = false;
			wizardCheckBox.Visible = false;
		}
	}

	public void GoTXTfile()
	{
		if (mf_Docking)
		{
			Program.mf.m_guiderForm.expand_ur();
		}
		else
		{
			base.WindowState = FormWindowState.Maximized;
		}
		tabControl.SelectedTab = txtPage;
	}

	public void GoExcelfile()
	{
		if (mf_Docking)
		{
			Program.mf.m_guiderForm.expand_ur();
		}
		else
		{
			base.WindowState = FormWindowState.Maximized;
		}
		tabControl.SelectedTab = excelPage;
	}

	public void GoPage(int Page)
	{
		base.WindowState = FormWindowState.Maximized;
		switch (Page)
		{
		case 0:
			tabControl.SelectedTab = ecsTabPage;
			break;
		case 1:
			tabControl.SelectedTab = reportTabPage;
			break;
		case 2:
			tabControl.SelectedTab = txtPage;
			break;
		case 3:
			tabControl.SelectedTab = excelPage;
			break;
		case 4:
			tabControl.SelectedTab = mdbTabPage;
			break;
		}
	}

	public void GoTXTfile_wStart()
	{
		GoTXTfile();
		if (txtPage_auto_checkbox.Enabled)
		{
			txtPage_auto_checkbox.Checked = true;
		}
		else
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + Program.GetLang("pw_FailedGettingintoCustomFileAuto_Mode"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	public void GoExcelfile_wStart()
	{
		GoExcelfile();
		if (excelPage_auto_checkbox.Enabled)
		{
			excelPage_auto_checkbox.Checked = true;
		}
		else
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + Program.GetLang("pw_FailedGettingintoCustomFileAuto_Mode"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void quicksetCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		if (!wizardCheckBox.Checked)
		{
			ItemDefaultEnable();
			wizardCheckBox.Visible = false;
		}
	}

	private void renameToolStripButton_Click(object sender, EventArgs e)
	{
		ListViewItem currentItem = GetCurrentItem();
		if (currentItem == null)
		{
			return;
		}
		if (!decimal.TryParse(currentItem.SubItems[3].Text, out var result))
		{
			result = 0m;
		}
		using NetRenameForm netRenameForm = new NetRenameForm(currentItem.SubItems[1].Text, currentItem.SubItems[2].Text, (int)result);
		if (netRenameForm.ShowDialog(this) == DialogResult.OK)
		{
			BeginNetworkAction(currentItem, NetworkAction.DownloadInfo, new object[3] { netRenameForm.shopName, netRenameForm.machineName, netRenameForm.machineNo });
		}
	}

	private void ipToolStripButton_Click(object sender, EventArgs e)
	{
		ListViewItem currentItem = GetCurrentItem();
		if (currentItem == null)
		{
			return;
		}
		using NetSetIPForm netSetIPForm = new NetSetIPForm(currentItem.SubItems[0].Text);
		if (netSetIPForm.ShowDialog(this) == DialogResult.OK)
		{
			BeginNetworkAction(currentItem, NetworkAction.DownloadIP, new object[12]
			{
				netSetIPForm.IP1_1, netSetIPForm.IP1_2, netSetIPForm.IP1_3, netSetIPForm.IP1_4, netSetIPForm.IP3_1, netSetIPForm.IP3_2, netSetIPForm.IP3_3, netSetIPForm.IP3_4, netSetIPForm.IP2_1, netSetIPForm.IP2_2,
				netSetIPForm.IP2_3, netSetIPForm.IP2_4
			});
		}
	}

	private void txtexeButtonCheck()
	{
		if (typeTextBox.Text.Length == 0)
		{
			CheckBox checkBox = txtPage_auto_checkbox;
			bool enabled = (txtExebutton.Enabled = false);
			checkBox.Enabled = enabled;
			return;
		}
		if (txtfileTextBox.Text.Length == 0)
		{
			CheckBox checkBox2 = txtPage_auto_checkbox;
			bool enabled2 = (txtExebutton.Enabled = false);
			checkBox2.Enabled = enabled2;
			return;
		}
		if (listView.SelectedItems.Count < 1)
		{
			txtExebutton.Enabled = false;
		}
		else
		{
			txtExebutton.Enabled = true;
		}
		txtPage_auto_checkbox.Enabled = true;
	}

	private void formtypeComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		if (formtypeComboBox.SelectedValue != null)
		{
			typeTextBox.Text = formtypeComboBox.SelectedValue.ToString();
		}
		typeTextBox.ReadOnly = formtypeComboBox.SelectedIndex > 0;
	}

	private void filenameTextBox_TextChanged(object sender, EventArgs e)
	{
		txtexeButtonCheck();
	}

	private void typeTextBox_TextChanged(object sender, EventArgs e)
	{
		txtexeButtonCheck();
	}

	private int txtExebutton_Click_Ori()
	{
		int num = 0;
		string text = txtfileTextBox.Text;
		if (string.IsNullOrEmpty(text))
		{
			return 0;
		}
		string text2 = typeTextBox.Text;
		if (string.IsNullOrEmpty(text2))
		{
			return 0;
		}
		Settings.Default.txtfilePath = txtfileTextBox.Text;
		Settings.Default.txtfileFormat = typeTextBox.Text;
		Settings.Default.txtfileUpdate = txtPage_update_checkbox.Checked;
		Settings.Default.txtfileClear = txtPage_clear_checkbox.Checked;
		Settings.Default.Save();
		Exception ex = Common.ArithmeticFile_Read(ref ecsDataSet, text, text2);
		if (ex == null)
		{
			if (txtPage_update_checkbox.Checked)
			{
				if (txtPage_clear_checkbox.Checked)
				{
					pLUTableAdapter.DeleteQuery();
				}
				else
				{
					using ECSDataSet eCSDataSet = new ECSDataSet();
					pLUTableAdapter.Fill(eCSDataSet.PLU);
					ecsDataSet.PLU.Merge(eCSDataSet.PLU, preserveChanges: true);
				}
				pLUTableAdapter.Update(ecsDataSet.PLU);
				DataSet_Update("PLU");
			}
			if (listView.CheckedItems.Count > 0)
			{
				ecsData_Log_Info(Program.GetLang("pw_Download_CustomFile") + " :" + string.Format(Program.GetLang("pw_cInfo_MultiDevice"), listView.CheckedItems.Count));
				foreach (ListViewItem checkedItem in listView.CheckedItems)
				{
					BeginNetworkAction(checkedItem, NetworkAction.DownloadECS, new object[21]
					{
						false,
						false,
						false,
						false,
						"",
						false,
						false,
						false,
						CheckState.Checked,
						false,
						false,
						false,
						"",
						false,
						false,
						false,
						"",
						"",
						0,
						0,
						false
					});
					num++;
				}
			}
		}
		else
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
		return num;
	}

	private void txtExebutton_Click(object sender, EventArgs e)
	{
		txtExebutton_Click_Ori();
	}

	private void txtSelAllbutton_Click_Ori()
	{
		selAllToolStripButton.Checked = true;
		foreach (ListViewItem item in listView.Items)
		{
			item.Checked = selAllToolStripButton.Checked;
		}
	}

	private void txtSelAllbutton_Click(object sender, EventArgs e)
	{
		txtSelAllbutton_Click_Ori();
	}

	private void txtbrowseButton_Click(object sender, EventArgs e)
	{
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.OverwritePrompt = false;
		saveFileDialog.CheckFileExists = false;
		saveFileDialog.FileName = txtfileTextBox.Text;
		if (saveFileDialog.ShowDialog(this) == DialogResult.OK)
		{
			txtfileTextBox.Text = saveFileDialog.FileName;
		}
	}

	private void excelbrowseButton_Click(object sender, EventArgs e)
	{
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.OverwritePrompt = false;
		saveFileDialog.CheckFileExists = false;
		saveFileDialog.FileName = excelfileTextBox.Text;
		saveFileDialog.Filter = Program.GetLang("pw_Excel_CSVFile___XLS___XLSX___CSV____xls___xlsx___csv");
		if (saveFileDialog.ShowDialog(this) == DialogResult.OK)
		{
			excelfileTextBox.Text = saveFileDialog.FileName;
		}
	}

	private void txtPage_update_checkbox_CheckedChanged(object sender, EventArgs e)
	{
		txtPage_clear_checkbox.Visible = txtPage_update_checkbox.Checked;
	}

	private void excelPage_update_checkbox_CheckedChanged(object sender, EventArgs e)
	{
		excelPage_clear_checkbox.Visible = excelPage_update_checkbox.Checked;
	}

	private static bool SetField(DataRow row, string field, object source)
	{
		string text = source.ToString().Trim();
		try
		{
			if (row[field].GetType() == typeof(int))
			{
				row[field] = int.Parse(text);
				return true;
			}
			if (row[field].GetType() == typeof(string))
			{
				row[field] = text;
				return true;
			}
			if (row[field].GetType() == typeof(decimal))
			{
				row[field] = decimal.Parse(text, NumberStyles.Currency);
				return true;
			}
			if (row[field].GetType() == typeof(bool))
			{
				if (text == "1" || text.ToLower() == "true")
				{
					row[field] = true;
					return true;
				}
				if (text == "0" || text.ToLower() == "false")
				{
					row[field] = false;
					return true;
				}
				return false;
			}
			return false;
		}
		catch
		{
			return false;
		}
	}

	private bool FillFields(OleDbDataReader reader, DataRow row)
	{
		for (int i = 0; i < Math.Min(excelBindingSource.Count, reader.FieldCount); i++)
		{
			DataRowView dataRowView = (DataRowView)excelBindingSource[i];
			ECSDataSet.ExcelRow excelRow = (ECSDataSet.ExcelRow)dataRowView.Row;
			if (string.IsNullOrEmpty(excelRow.Field))
			{
				continue;
			}
			if (excelRow.Field == "[Unit].[Name]")
			{
				string arg = reader[i].ToString();
				DataRow[] array = ecsDataSet.Unit.Select($"[Name] = '{arg}'");
				if (array.Length > 0)
				{
					row["UnitID"] = array[0]["UnitID"];
				}
				else
				{
					row["UnitID"] = 0;
				}
			}
			else if (excelRow.Field == "PC_UD_Plus")
			{
				if (!SetField(row, "PC_UD", reader[i]))
				{
					return false;
				}
				if ((int)row["PC_UD"] >= 1)
				{
					row["PS_UD"] = 1;
				}
				else
				{
					row["PS_UD"] = 0;
				}
			}
			else if (excelRow.Field == "UnitID")
			{
				string text = reader[i].ToString().Trim();
				if (UnitTable == null || UnitTable.Length <= 1)
				{
					row["UnitID"] = int.Parse(text);
					continue;
				}
				int num = 0;
				while (true)
				{
					if (num >= UnitTable.Length - 1)
					{
						row["UnitID"] = int.Parse(text);
						break;
					}
					if (text == UnitTable[num])
					{
						row["UnitID"] = int.Parse(UnitTable[num + 1]);
						break;
					}
					num += 2;
				}
			}
			else if (!SetField(row, excelRow.Field, reader[i]))
			{
				return false;
			}
		}
		return true;
	}

	private void SetDefaultValues(ECSDataSet dataSet)
	{
		foreach (DataRowView item in excelDefaultBindingSource)
		{
			ECSDataSet.ExcelDefaultRow excelDefaultRow = (ECSDataSet.ExcelDefaultRow)item.Row;
			string text = excelDefaultRow.Default.Trim();
			if (string.IsNullOrEmpty(excelDefaultRow.Field))
			{
				continue;
			}
			if (excelDefaultRow.Field == "[Unit].[Name]")
			{
				DataRow[] array = ecsDataSet.Unit.Select($"[Name] = '{text}'");
				if (array.Length > 0)
				{
					dataSet.PLU.UnitIDColumn.DefaultValue = array[0]["UnitID"];
				}
				continue;
			}
			if (excelDefaultRow.Field == "UnitID" && text.Contains("|"))
			{
				UnitTable = text.Split('|');
				dataSet.PLU.Columns["UnitID"].DefaultValue = Program.ParseInt(UnitTable[UnitTable.Length - 1]);
				continue;
			}
			DataColumn dataColumn = dataSet.PLU.Columns[excelDefaultRow.Field];
			if (dataColumn == null)
			{
				continue;
			}
			try
			{
				if (dataColumn.DataType == typeof(int))
				{
					dataColumn.DefaultValue = int.Parse(text);
				}
				else if (dataColumn.DataType == typeof(string))
				{
					dataColumn.DefaultValue = text;
				}
				else if (dataColumn.DataType == typeof(decimal))
				{
					dataColumn.DefaultValue = decimal.Parse(text);
				}
				else if (dataColumn.DataType == typeof(bool))
				{
					if (text == "1" || text.ToLower() == "true")
					{
						dataColumn.DefaultValue = true;
					}
					else if (text == "0" || text.ToLower() == "false")
					{
						dataColumn.DefaultValue = false;
					}
				}
			}
			catch
			{
			}
		}
	}

	private Exception OpenFromExcel(string filename)
	{
		Exception result = null;
		try
		{
			Cursor.Current = Cursors.WaitCursor;
			using ECSDataSet eCSDataSet = new ECSDataSet();
			SetDefaultValues(eCSDataSet);
			if (Path.GetExtension(filename).ToLower().Equals(".xls") || Path.GetExtension(filename).ToLower().Equals(".xlsx"))
			{
				string connectionString = ((!Path.GetExtension(filename).ToLower().Equals(".xls")) ? ("Provider=Microsoft.ACE.OLEDB.12.0;Data Source=" + filename + ";Extended Properties=\"Excel 12.0;HDR=NO;IMEX=1\"") : ("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" + filename + ";Extended Properties=\"Excel 8.0;HDR=NO;IMEX=1\""));
				using OleDbConnection oleDbConnection = new OleDbConnection(connectionString);
				oleDbConnection.Open();
				DataTable oleDbSchemaTable = oleDbConnection.GetOleDbSchemaTable(OleDbSchemaGuid.Tables, new object[4] { null, null, null, "TABLE" });
				for (int i = 0; i < oleDbSchemaTable.Rows.Count; i++)
				{
					string text = oleDbSchemaTable.Rows[i][2].ToString().Trim();
					if (oleDbSchemaTable.Rows.Count != 1 && !text.EndsWith("$") && !text.EndsWith("$'"))
					{
						continue;
					}
					string cmdText = "SELECT * FROM [" + text + "]";
					OleDbCommand oleDbCommand = new OleDbCommand(cmdText, oleDbConnection);
					using OleDbDataReader oleDbDataReader = oleDbCommand.ExecuteReader();
					while (oleDbDataReader.Read())
					{
						ECSDataSet.PLURow pLURow = eCSDataSet.PLU.NewPLURow();
						if (FillFields(oleDbDataReader, pLURow) && pLURow.PLUID >= Settings.Default.minUserPLUID && eCSDataSet.PLU.FindByPLUID(pLURow.PLUID) == null)
						{
							eCSDataSet.PLU.Rows.Add(pLURow.ItemArray);
						}
					}
					oleDbDataReader.Close();
				}
				oleDbConnection.Close();
			}
			else
			{
				if (!Path.GetExtension(filename).ToLower().Equals(".csv"))
				{
					throw new IOException("Only .xls and .csv allowed");
				}
				string connectionString2 = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" + Path.GetDirectoryName(filename) + ";Extended Properties='Text;FMT=Delimited;HDR=NO;IMEX=1;'";
				using OleDbConnection oleDbConnection2 = new OleDbConnection(connectionString2);
				oleDbConnection2.Open();
				OleDbCommand oleDbCommand2 = new OleDbCommand($"SELECT * FROM [{Path.GetFileName(filename)}]", oleDbConnection2);
				using (OleDbDataReader oleDbDataReader2 = oleDbCommand2.ExecuteReader())
				{
					while (oleDbDataReader2.Read())
					{
						ECSDataSet.PLURow pLURow2 = eCSDataSet.PLU.NewPLURow();
						if (FillFields(oleDbDataReader2, pLURow2) && pLURow2.PLUID >= Settings.Default.minUserPLUID && eCSDataSet.PLU.FindByPLUID(pLURow2.PLUID) == null)
						{
							eCSDataSet.PLU.Rows.Add(pLURow2.ItemArray);
						}
					}
					oleDbDataReader2.Close();
				}
				oleDbConnection2.Close();
			}
			UpdatedFromExcel = eCSDataSet.PLU.Count;
			ecsDataSet.PLU.Clear();
			ecsDataSet.PLU.Merge(eCSDataSet.PLU);
			if (excelPage_update_checkbox.Checked)
			{
				if (excelPage_clear_checkbox.Checked)
				{
					pLUTableAdapter.DeleteQuery();
				}
				else
				{
					using ECSDataSet eCSDataSet2 = new ECSDataSet();
					pLUTableAdapter.Fill(eCSDataSet2.PLU);
					ecsDataSet.PLU.Merge(eCSDataSet2.PLU, preserveChanges: true);
				}
				pLUTableAdapter.Update(ecsDataSet.PLU);
				DataSet_Update("PLU");
			}
		}
		catch (Exception ex)
		{
			result = ex;
		}
		finally
		{
			Cursor.Current = Cursors.Default;
		}
		return result;
	}

	private void excelExebutton_Click(object sender, EventArgs e)
	{
		if (excelBindingSource.Count <= 0)
		{
			return;
		}
		string text = excelfileTextBox.Text;
		if (string.IsNullOrEmpty(text))
		{
			return;
		}
		Settings.Default.excelfilePath = excelfileTextBox.Text;
		Settings.Default.excelfileUpdate = excelPage_update_checkbox.Checked;
		Settings.Default.excelfileClear = excelPage_clear_checkbox.Checked;
		Settings.Default.Save();
		excelBindingSource.EndEdit();
		excelDefaultBindingSource.EndEdit();
		try
		{
			excelTableAdapter.Update(ecsDataSet.Excel);
			excelDefaultTableAdapter.Update(ecsDataSet.ExcelDefault);
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			return;
		}
		Exception ex2 = OpenFromExcel(text);
		if (ex2 == null)
		{
			if (listView.CheckedItems.Count <= 0)
			{
				return;
			}
			ecsData_Log_Info(Program.GetLang("pw_Download_ExcelCSVFile") + " :" + string.Format(Program.GetLang("pw_cInfo_MultiDevice"), listView.CheckedItems.Count));
			{
				foreach (ListViewItem checkedItem in listView.CheckedItems)
				{
					BeginNetworkAction(checkedItem, NetworkAction.DownloadECS, new object[21]
					{
						false,
						false,
						false,
						false,
						"",
						false,
						false,
						false,
						CheckState.Checked,
						false,
						false,
						false,
						"",
						false,
						false,
						false,
						"",
						"",
						0,
						0,
						false
					});
				}
				return;
			}
		}
		DialogResult dialogResult = MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		if (dialogResult == DialogResult.OK && ex2.Message.Contains("Microsoft.ACE.OLEDB.12.0"))
		{
			string text2 = Program.Config_GetCurrentLang();
			if (text2 == "zh-CHS")
			{
				Process.Start("https://www.microsoft.com/zh-cn/download/details.aspx?id=13255");
			}
			else if (text2 == "zh-CHT")
			{
				Process.Start("https://www.microsoft.com/zh-tw/download/details.aspx?id=13255");
			}
			else
			{
				Process.Start("https://www.microsoft.com/en-us/download/details.aspx?id=13255 ");
			}
		}
	}

	private void TabledAuto_Button_Click(object sender, EventArgs e)
	{
		bool flag = false;
		try
		{
			foreach (ListViewItem item in listView.Items)
			{
				MyTag itemTag = GetItemTag(item);
				if (itemTag.TableType != TableType.Unattached || itemTag.LinkType == LinkType.TcpOffline || item.SubItems[8].Text.Length == 0)
				{
					continue;
				}
				if (TabledAutoReNumber_CheckBox.Checked && int.Parse(item.SubItems[3].Text) == 0)
				{
					int num = 1;
					while (true)
					{
						string arg = '★' + item.SubItems[1].Text + '★' + item.SubItems[2].Text + '★' + num.ToString();
						string filterExpression = $"[Name] = '{arg}'";
						DataRow[] array = RDS.reportDataSet.Device.Select(filterExpression);
						if (array.Length < 1)
						{
							break;
						}
						num++;
					}
					item.SubItems[3].Text = num.ToString();
					BeginNetworkAction(item, NetworkAction.DownloadInfo, new object[4]
					{
						item.SubItems[1].Text,
						item.SubItems[2].Text,
						num,
						item.SubItems[8].Text
					});
				}
				if (!flag)
				{
					try
					{
						Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
						flag = true;
					}
					catch (ApplicationException ex)
					{
						MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
						return;
					}
				}
				string deviceName = '★' + item.SubItems[1].Text + '★' + item.SubItems[2].Text + '★' + item.SubItems[3].Text;
				string mac = item.SubItems[8].Text;
				RDS.NL_DeviceAdd(deviceName, mac, 1, Program.GetLang("pw_Default"));
				UpdateTableTypeText(item);
			}
		}
		catch
		{
		}
		finally
		{
			if (flag)
			{
				Program.reportLock.ReleaseWriterLock();
			}
		}
		UpdateUI();
	}

	private void MDBsave_Button_Click(object sender, EventArgs e)
	{
		Settings.Default.ftptarget = fileComboBox.SelectedIndex;
		Settings.Default.ftpurl = uriTextBox.Text;
		if (!logCheckBox.Checked || usernameTextBox.Text == "")
		{
			Settings settings = Settings.Default;
			string ftpuser = (Settings.Default.ftppass = "");
			settings.ftpuser = ftpuser;
		}
		else
		{
			Settings.Default.ftpuser = usernameTextBox.Text;
			Settings.Default.ftppass = passwordTextBox.Text;
		}
		Settings.Default.Save();
	}

	private void vipCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		vipPointCheckBox.Enabled = vipCheckBox.Checked && saveButton.Checked;
	}

	private void fontCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		fontComboBox.Enabled = fontCheckBox.Checked;
	}

	private void AutoTXT_Auto_CallBack(object state)
	{
		AutoTXT_Auto((int)state);
	}

	private void AutoTXT_Start()
	{
		if (!AutoTXT_Running)
		{
			AutoTXT_Running = true;
			Thread.Sleep(1000 * Settings.Default.txtfileDelay);
			AutoTXT_Auto(10);
		}
	}

	private void AutoTXT_Auto(int WaitSecond)
	{
		if (listView.InvokeRequired)
		{
			Invoke(new AutoTXT_AutoCallback(AutoTXT_Auto), WaitSecond);
			return;
		}
		string text = Application.StartupPath + "\\AutoTXT.bk";
		string txtfileFormat = Settings.Default.txtfileFormat;
		if (string.IsNullOrEmpty(text) || string.IsNullOrEmpty(txtfileFormat))
		{
			AutoTXT_Running = false;
			return;
		}
		if (listView.Items.Count == 0 && WaitSecond > 0)
		{
			AutoTXT_Running = true;
			TimeSpan dueTime = TimeSpan.FromSeconds(1.0);
			new System.Threading.Timer(AutoTXT_Auto_CallBack, WaitSecond - 1, dueTime, TimeSpan.Zero);
			return;
		}
		try
		{
			FileInfo fileInfo = new FileInfo(Settings.Default.txtfilePath);
			if (!fileInfo.Exists)
			{
				AutoTXT_Running = false;
				return;
			}
			if (fileInfo.Length <= 0)
			{
				if (WaitSecond < 0)
				{
					AutoTXT_Running = false;
				}
				else if (WaitSecond == 0)
				{
					MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + Program.GetLang("pw_Failed_NoValidData"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
					AutoTXT_Running = false;
				}
				else
				{
					AutoTXT_Running = true;
					TimeSpan dueTime2 = TimeSpan.FromSeconds(1.0);
					new System.Threading.Timer(AutoTXT_Auto_CallBack, WaitSecond - 1, dueTime2, TimeSpan.Zero);
				}
				return;
			}
			File.Delete(text);
			try
			{
				if (Settings.Default.txtfileAutoClear)
				{
					fileInfo.MoveTo(text);
				}
				else
				{
					fileInfo.CopyTo(text);
				}
			}
			catch (Exception ex)
			{
				if (WaitSecond <= 0)
				{
					MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
					AutoTXT_Running = false;
				}
				else
				{
					AutoTXT_Running = true;
					TimeSpan dueTime3 = TimeSpan.FromSeconds(1.0);
					new System.Threading.Timer(AutoTXT_Auto_CallBack, WaitSecond - 1, dueTime3, TimeSpan.Zero);
				}
				return;
			}
			int num = 0;
			Exception ex2 = Common.ArithmeticFile_Read(ref ecsDataSet, text, txtfileFormat);
			if (ex2 == null)
			{
				int count = ecsDataSet.PLU.Count;
				if (txtPage_update_checkbox.Checked)
				{
					if (txtPage_clear_checkbox.Checked)
					{
						pLUTableAdapter.DeleteQuery();
					}
					else
					{
						using ECSDataSet eCSDataSet = new ECSDataSet();
						pLUTableAdapter.Fill(eCSDataSet.PLU);
						ecsDataSet.PLU.Merge(eCSDataSet.PLU, preserveChanges: true);
					}
					pLUTableAdapter.Update(ecsDataSet.PLU);
					DataSet_Update("PLU");
				}
				ecsData_Log_Info(Program.GetLang("pw_Download_CustomFile") + " :" + string.Format(Program.GetLang("pw_cInfo_MultiDevice"), listView.CheckedItems.Count));
				foreach (ListViewItem item in listView.Items)
				{
					if (BeginNetworkAction(item, NetworkAction.DownloadECS, new object[21]
					{
						false,
						false,
						false,
						false,
						"",
						false,
						false,
						false,
						CheckState.Checked,
						false,
						false,
						false,
						"",
						false,
						false,
						false,
						"",
						"",
						0,
						0,
						false
					}))
					{
						num++;
					}
				}
				Program.mf.ShowBallonTip(Program.GetLang("pw_Download_CustomFile"), num + " " + Program.GetLang("pw_Devices") + ": " + count + " PLUs");
				AutoTXT_Running = false;
			}
			else if (WaitSecond <= 0)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				AutoTXT_Running = false;
			}
			else
			{
				AutoTXT_Running = true;
				TimeSpan dueTime4 = TimeSpan.FromSeconds(1.0);
				new System.Threading.Timer(AutoTXT_Auto_CallBack, WaitSecond - 1, dueTime4, TimeSpan.Zero);
			}
		}
		catch (Exception ex3)
		{
			if (WaitSecond <= 0)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex3.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				AutoTXT_Running = false;
			}
			else
			{
				AutoTXT_Running = true;
				TimeSpan dueTime5 = TimeSpan.FromSeconds(1.0);
				new System.Threading.Timer(AutoTXT_Auto_CallBack, WaitSecond - 1, dueTime5, TimeSpan.Zero);
			}
		}
	}

	private void AutoTXT_OnRenamed(object source, RenamedEventArgs e)
	{
		string text = ((FileSystemWatcher)source).Path + ((FileSystemWatcher)source).Filter;
		if (e.FullPath == text)
		{
			AutoTXT_Start();
		}
	}

	private void AutoTXT_OnCreated(object source, FileSystemEventArgs e)
	{
		AutoTXT_Start();
	}

	private void AutoTXT_OnChanged(object source, FileSystemEventArgs e)
	{
		AutoTXT_Start();
	}

	private void txtPage_auto_checkbox_CheckedChanged(object sender, EventArgs e)
	{
		if (txtPage_auto_checkbox.Checked)
		{
			Settings.Default.txtfilePath = txtfileTextBox.Text;
			Settings.Default.txtfileFormat = typeTextBox.Text;
			Settings.Default.txtfileUpdate = txtPage_update_checkbox.Checked;
			Settings.Default.txtfileClear = txtPage_clear_checkbox.Checked;
			Settings.Default.txtfileAutoClear = txtPage_autoclear_checkbox.Checked;
			Settings.Default.txtfileDelay = (int)txtPage_MonitorDelay_NumericUpDown.Value;
			Settings.Default.Save();
			TextBox textBox = txtfileTextBox;
			Button button = txtbrowseButton;
			ComboBox comboBox = formtypeComboBox;
			TextBox textBox2 = typeTextBox;
			CheckBox checkBox = txtPage_autoclear_checkbox;
			CheckBox checkBox2 = txtPage_clear_checkbox;
			CheckBox checkBox3 = txtPage_update_checkbox;
			Button button2 = txtSelAllbutton;
			bool flag = (txtExebutton.Visible = false);
			bool flag3 = (button2.Enabled = flag);
			bool flag5 = (checkBox3.Enabled = flag3);
			bool flag7 = (checkBox2.Enabled = flag5);
			bool flag9 = (checkBox.Enabled = flag7);
			bool flag11 = (textBox2.Enabled = flag9);
			bool flag13 = (comboBox.Enabled = flag11);
			bool enabled = (button.Enabled = flag13);
			textBox.Enabled = enabled;
			Button button3 = txtPage_startup_Button;
			bool visible = (txtPage_systemtray_Button.Visible = true);
			button3.Visible = visible;
			watcher_txt = new FileSystemWatcher();
			watcher_txt.Path = Path.GetDirectoryName(txtfileTextBox.Text);
			watcher_txt.Filter = Path.GetFileName(txtfileTextBox.Text);
			watcher_txt.NotifyFilter = NotifyFilters.FileName | NotifyFilters.DirectoryName | NotifyFilters.LastWrite | NotifyFilters.LastAccess;
			watcher_txt.Created += AutoTXT_OnCreated;
			watcher_txt.Changed += AutoTXT_OnChanged;
			watcher_txt.Renamed += AutoTXT_OnRenamed;
			watcher_txt.EnableRaisingEvents = true;
			AutoTXT_Auto(-1);
		}
		else
		{
			watcher_txt.Dispose();
			TextBox textBox3 = txtfileTextBox;
			Button button4 = txtbrowseButton;
			ComboBox comboBox2 = formtypeComboBox;
			TextBox textBox4 = typeTextBox;
			CheckBox checkBox4 = txtPage_autoclear_checkbox;
			CheckBox checkBox5 = txtPage_clear_checkbox;
			CheckBox checkBox6 = txtPage_update_checkbox;
			Button button5 = txtSelAllbutton;
			bool flag17 = (txtExebutton.Visible = true);
			bool flag19 = (button5.Enabled = flag17);
			bool flag21 = (checkBox6.Enabled = flag19);
			bool flag23 = (checkBox5.Enabled = flag21);
			bool flag25 = (checkBox4.Enabled = flag23);
			bool flag27 = (textBox4.Enabled = flag25);
			bool flag29 = (comboBox2.Enabled = flag27);
			bool enabled2 = (button4.Enabled = flag29);
			textBox3.Enabled = enabled2;
			Button button6 = txtPage_startup_Button;
			bool visible2 = (txtPage_systemtray_Button.Visible = false);
			button6.Visible = visible2;
		}
	}

	private void txtPage_systemtray_Button_Click(object sender, EventArgs e)
	{
		Program.mf.SystemTray();
	}

	private void ReportInfo_TextBox_TextChanged(object sender, EventArgs e)
	{
		ReportInfo_TextBox.Select(ReportInfo_TextBox.TextLength, 0);
		ReportInfo_TextBox.ScrollToCaret();
	}

	private void ReportError_TextBox_TextChanged(object sender, EventArgs e)
	{
		ReportError_TextBox.Select(ReportError_TextBox.TextLength, 0);
		ReportError_TextBox.ScrollToCaret();
	}

	private void ExistStock_Button_Click(object sender, EventArgs e)
	{
		ListViewItem currentItem = GetCurrentItem();
		if (currentItem == null)
		{
			return;
		}
		MyTag itemTag = GetItemTag(currentItem);
		if (itemTag.TableType != TableType.Unattached)
		{
			return;
		}
		using DeviceSelForm deviceSelForm = new DeviceSelForm();
		if (deviceSelForm.ShowDialog(this) != DialogResult.OK)
		{
			return;
		}
		try
		{
			Program.reportLock.AcquireWriterLock(Settings.Default.recvTimeOut);
		}
		catch (ApplicationException ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			return;
		}
		try
		{
			if (RDS.NL_DeviceAdd_FromDeviceSel('★' + currentItem.SubItems[1].Text + '★' + currentItem.SubItems[2].Text + '★' + currentItem.SubItems[3].Text, currentItem.SubItems[8].Text, deviceSelForm.SG_ID, deviceSelForm.SG_Name, deviceSelForm.SG_New))
			{
				UpdateTableTypeText(currentItem);
				UpdateUI();
			}
			else
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
		catch
		{
		}
		finally
		{
			Program.reportLock.ReleaseWriterLock();
		}
	}

	private void AutoExcel_Auto_CallBack(object state)
	{
		AutoExcel_Auto((int)state);
	}

	private void AutoExcel_Start()
	{
		if (!AutoExcel_Running)
		{
			AutoExcel_Running = true;
			Thread.Sleep(1000 * Settings.Default.excelfileDelay);
			AutoExcel_Auto(10);
		}
	}

	private void AutoExcel_Auto(int WaitSecond)
	{
		if (listView.InvokeRequired)
		{
			Invoke(new AutoExcel_AutoCallback(AutoExcel_Auto), WaitSecond);
			return;
		}
		string text = Application.StartupPath + "\\AutoExcel" + Path.GetExtension(Settings.Default.excelfilePath);
		if (string.IsNullOrEmpty(text) || excelBindingSource.Count <= 0)
		{
			AutoExcel_Running = false;
			return;
		}
		if (listView.Items.Count == 0 && WaitSecond > 0)
		{
			AutoExcel_Running = true;
			TimeSpan dueTime = TimeSpan.FromSeconds(1.0);
			new System.Threading.Timer(AutoExcel_Auto_CallBack, WaitSecond - 1, dueTime, TimeSpan.Zero);
			return;
		}
		try
		{
			FileInfo fileInfo = new FileInfo(Settings.Default.excelfilePath);
			if (!fileInfo.Exists)
			{
				AutoExcel_Running = false;
				return;
			}
			if (fileInfo.Length <= 0)
			{
				if (WaitSecond < 0)
				{
					AutoExcel_Running = false;
				}
				else if (WaitSecond == 0)
				{
					MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + Program.GetLang("pw_Failed_NoValidData"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
					AutoExcel_Running = false;
				}
				else
				{
					AutoExcel_Running = true;
					TimeSpan dueTime2 = TimeSpan.FromSeconds(1.0);
					new System.Threading.Timer(AutoExcel_Auto_CallBack, WaitSecond - 1, dueTime2, TimeSpan.Zero);
				}
				return;
			}
			File.Delete(text);
			try
			{
				if (Settings.Default.excelfileAutoClear)
				{
					fileInfo.MoveTo(text);
				}
				else
				{
					fileInfo.CopyTo(text);
				}
			}
			catch (Exception ex)
			{
				if (WaitSecond <= 0)
				{
					MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
					AutoExcel_Running = false;
				}
				else
				{
					AutoExcel_Running = true;
					TimeSpan dueTime3 = TimeSpan.FromSeconds(1.0);
					new System.Threading.Timer(AutoExcel_Auto_CallBack, WaitSecond - 1, dueTime3, TimeSpan.Zero);
				}
				return;
			}
			int num = 0;
			Exception ex2 = OpenFromExcel(text);
			if (ex2 == null)
			{
				if (excelPage_update_checkbox.Checked)
				{
					if (excelPage_clear_checkbox.Checked)
					{
						pLUTableAdapter.DeleteQuery();
					}
					else
					{
						using ECSDataSet eCSDataSet = new ECSDataSet();
						pLUTableAdapter.Fill(eCSDataSet.PLU);
						ecsDataSet.PLU.Merge(eCSDataSet.PLU, preserveChanges: true);
					}
					pLUTableAdapter.Update(ecsDataSet.PLU);
					DataSet_Update("PLU");
				}
				ecsData_Log_Info(Program.GetLang("pw_Download_ExcelCSVFile") + " :" + string.Format(Program.GetLang("pw_cInfo_MultiDevice"), listView.CheckedItems.Count));
				foreach (ListViewItem item in listView.Items)
				{
					if (BeginNetworkAction(item, NetworkAction.DownloadECS, new object[21]
					{
						false,
						false,
						false,
						false,
						"",
						false,
						false,
						false,
						CheckState.Checked,
						false,
						false,
						false,
						"",
						false,
						false,
						false,
						"",
						"",
						0,
						0,
						false
					}))
					{
						num++;
					}
				}
				Program.mf.ShowBallonTip(Program.GetLang("pw_Download_ExcelCSVFile"), num + " " + Program.GetLang("pw_Devices") + ": " + UpdatedFromExcel + " PLUs");
				AutoExcel_Running = false;
			}
			else if (WaitSecond <= 0)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				AutoExcel_Running = false;
			}
			else
			{
				AutoExcel_Running = true;
				TimeSpan dueTime4 = TimeSpan.FromSeconds(1.0);
				new System.Threading.Timer(AutoExcel_Auto_CallBack, WaitSecond - 1, dueTime4, TimeSpan.Zero);
			}
		}
		catch (Exception ex3)
		{
			if (WaitSecond <= 0)
			{
				DialogResult dialogResult = MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex3.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				if (dialogResult == DialogResult.OK && ex3.Message.Contains("Microsoft.ACE.OLEDB.12.0"))
				{
					string text2 = Program.Config_GetCurrentLang();
					if (text2 == "zh-CHS")
					{
						Process.Start("https://www.microsoft.com/zh-cn/download/details.aspx?id=13255");
					}
					else if (text2 == "zh-CHT")
					{
						Process.Start("https://www.microsoft.com/zh-tw/download/details.aspx?id=13255");
					}
					else
					{
						Process.Start("https://www.microsoft.com/en-us/download/details.aspx?id=13255 ");
					}
				}
				AutoExcel_Running = false;
			}
			else
			{
				AutoExcel_Running = true;
				TimeSpan dueTime5 = TimeSpan.FromSeconds(1.0);
				new System.Threading.Timer(AutoExcel_Auto_CallBack, WaitSecond - 1, dueTime5, TimeSpan.Zero);
			}
		}
	}

	private void AutoExcel_OnRenamed(object source, RenamedEventArgs e)
	{
		string text = ((FileSystemWatcher)source).Path + ((FileSystemWatcher)source).Filter;
		if (e.FullPath == text)
		{
			AutoExcel_Start();
		}
	}

	private void AutoExcel_OnCreated(object source, FileSystemEventArgs e)
	{
		AutoExcel_Start();
	}

	private void AutoExcel_OnChanged(object source, FileSystemEventArgs e)
	{
		AutoExcel_Start();
	}

	private void excelPage_systemtray_Button_Click(object sender, EventArgs e)
	{
		Program.mf.SystemTray();
	}

	private void excelPage_auto_checkbox_CheckedChanged(object sender, EventArgs e)
	{
		if (excelPage_auto_checkbox.Checked)
		{
			_ = excelfileTextBox.Text;
			Settings.Default.excelfilePath = excelfileTextBox.Text;
			Settings.Default.excelfileUpdate = excelPage_update_checkbox.Checked;
			Settings.Default.excelfileClear = excelPage_clear_checkbox.Checked;
			Settings.Default.excelfileAutoClear = excelPage_autoclear_checkbox.Checked;
			Settings.Default.excelfileDelay = (int)excelPage_MonitorDelay_NumericUpDown.Value;
			Settings.Default.Save();
			excelBindingSource.EndEdit();
			excelDefaultBindingSource.EndEdit();
			try
			{
				excelTableAdapter.Update(ecsDataSet.Excel);
				excelDefaultTableAdapter.Update(ecsDataSet.ExcelDefault);
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				return;
			}
			TextBox textBox = excelfileTextBox;
			SplitContainer obj = splitContainer2;
			CheckBox checkBox = excelPage_autoclear_checkbox;
			CheckBox checkBox2 = excelPage_clear_checkbox;
			CheckBox checkBox3 = excelPage_update_checkbox;
			Button button = excelSelAllbutton;
			bool flag = (excelExebutton.Visible = false);
			bool flag3 = (button.Enabled = flag);
			bool flag5 = (checkBox3.Enabled = flag3);
			bool flag7 = (checkBox2.Enabled = flag5);
			bool flag9 = (checkBox.Enabled = flag7);
			bool enabled = (obj.Enabled = flag9);
			textBox.Enabled = enabled;
			Button button2 = excelPage_startup_Button;
			bool visible = (excelPage_systemtray_Button.Visible = true);
			button2.Visible = visible;
			watcher_excel = new FileSystemWatcher();
			watcher_excel.Path = Path.GetDirectoryName(excelfileTextBox.Text);
			watcher_excel.Filter = Path.GetFileName(excelfileTextBox.Text);
			watcher_excel.NotifyFilter = NotifyFilters.FileName | NotifyFilters.DirectoryName | NotifyFilters.LastWrite | NotifyFilters.LastAccess;
			watcher_excel.Created += AutoExcel_OnCreated;
			watcher_excel.Changed += AutoExcel_OnChanged;
			watcher_excel.Renamed += AutoExcel_OnRenamed;
			watcher_excel.EnableRaisingEvents = true;
			AutoExcel_Running = false;
			AutoExcel_Auto(-1);
		}
		else
		{
			watcher_excel.Dispose();
			TextBox textBox2 = excelfileTextBox;
			SplitContainer obj2 = splitContainer2;
			CheckBox checkBox4 = excelPage_autoclear_checkbox;
			CheckBox checkBox5 = excelPage_clear_checkbox;
			CheckBox checkBox6 = excelPage_update_checkbox;
			Button button3 = excelSelAllbutton;
			bool flag13 = (excelExebutton.Visible = true);
			bool flag15 = (button3.Enabled = flag13);
			bool flag17 = (checkBox6.Enabled = flag15);
			bool flag19 = (checkBox5.Enabled = flag17);
			bool flag21 = (checkBox4.Enabled = flag19);
			bool enabled2 = (obj2.Enabled = flag21);
			textBox2.Enabled = enabled2;
			Button button4 = excelPage_startup_Button;
			bool visible2 = (excelPage_systemtray_Button.Visible = false);
			button4.Visible = visible2;
		}
	}

	private void MAC_ToolStripButton_Click(object sender, EventArgs e)
	{
		ListViewItem currentItem = GetCurrentItem();
		if (currentItem != null && MessageBox.Show(this, "<" + MAC_ToolStripButton.Text + ">", Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) == DialogResult.Yes)
		{
			Random random = new Random();
			BeginNetworkAction(currentItem, NetworkAction.DownloadMAC, new object[6]
			{
				0,
				35,
				240,
				255,
				random.Next(0, 256),
				random.Next(0, 256)
			});
		}
	}

	private void MACr_ToolStripButton_Click(object sender, EventArgs e)
	{
	}

	public void mf_Dock_Start(Panel pl)
	{
		mf_Docking_Panel = pl;
		mf_Docking = true;
		mf_Dock_In();
	}

	public void mf_Dock_End()
	{
		mf_Docking = false;
		mf_Dock_Out();
		Close();
	}

	public void mf_Dock_In()
	{
		base.Parent = mf_Docking_Panel;
		base.FormBorderStyle = FormBorderStyle.None;
		Dock = DockStyle.Fill;
		splitContainer.Panel2Collapsed = true;
		ToolStripButton toolStripButton = selAllToolStripButton;
		ToolStripButton toolStripButton2 = cancelToolStripButton;
		bool flag = (taskToolStripButton.Visible = false);
		bool visible = (toolStripButton2.Visible = flag);
		toolStripButton.Visible = visible;
		expandshrink_ToolStrip.Visible = true;
		expand_toolStripButton.Visible = true;
		shrink_ToolStripButton.Visible = false;
		mf_Docked = true;
	}

	public void mf_Dock_Out()
	{
		base.MdiParent = Program.mf;
		Dock = DockStyle.None;
		base.FormBorderStyle = FormBorderStyle.Sizable;
		splitContainer.Panel2Collapsed = false;
		ToolStripButton toolStripButton = selAllToolStripButton;
		ToolStripButton toolStripButton2 = cancelToolStripButton;
		bool flag = (taskToolStripButton.Visible = true);
		bool visible = (toolStripButton2.Visible = flag);
		toolStripButton.Visible = visible;
		expandshrink_ToolStrip.Visible = false;
		expand_toolStripButton.Visible = false;
		shrink_ToolStripButton.Visible = false;
		base.Location = new Point(Program.mf.Size.Width * 3 / 8, Program.mf.Size.Height / 8);
		base.Size = new Size(Program.mf.Size.Width / 2, Program.mf.Size.Height / 2);
		mf_Docked = false;
		BringToFront();
	}

	public void mf_Expand()
	{
		expand_toolStripButton.Visible = false;
		shrink_ToolStripButton.Visible = true;
		splitContainer.Panel2Collapsed = false;
		ToolStripButton toolStripButton = selAllToolStripButton;
		ToolStripButton toolStripButton2 = cancelToolStripButton;
		bool flag = (taskToolStripButton.Visible = true);
		bool visible = (toolStripButton2.Visible = flag);
		toolStripButton.Visible = visible;
	}

	public void mf_Shrink()
	{
		expand_toolStripButton.Visible = true;
		shrink_ToolStripButton.Visible = false;
		splitContainer.Panel2Collapsed = true;
		ToolStripButton toolStripButton = selAllToolStripButton;
		ToolStripButton toolStripButton2 = cancelToolStripButton;
		bool flag = (taskToolStripButton.Visible = false);
		bool visible = (toolStripButton2.Visible = flag);
		toolStripButton.Visible = visible;
	}

	private void expand_Button_Click(object sender, EventArgs e)
	{
		Program.mf.m_guiderForm.expand_ur();
	}

	private void shrink_ToolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.m_guiderForm.expand_normal();
	}

	private void listView_ItemCheck(object sender, ItemCheckEventArgs e)
	{
		if (((MyTag)listView.Items[e.Index].Tag).LinkType == LinkType.TcpOffline)
		{
			e.NewValue = CheckState.Unchecked;
		}
	}

	private void ecsData_TextBox_TextChanged(object sender, EventArgs e)
	{
		ecsData_TextBox.Select(ecsData_TextBox.TextLength, 0);
		ecsData_TextBox.ScrollToCaret();
	}

	private void txtPage_startup_Button_Click(object sender, EventArgs e)
	{
		using StartUpForm startUpForm = new StartUpForm("-A2A -SystemTray", cfix: true);
		startUpForm.ShowDialog(this);
	}

	private void excelPage_startup_Button_Click(object sender, EventArgs e)
	{
		using StartUpForm startUpForm = new StartUpForm("-A3A -SystemTray", cfix: true);
		startUpForm.ShowDialog(this);
	}

	private void reportTimer_Tick(object sender, EventArgs e)
	{
		int num;
		if (gAsk && Settings.Default.gen_AskLogs && Settings.Default.gen_AskLogs_OnlyIdle && Program.GetLastInputTime() < 30000)
		{
			AskLogs_ExDevice = 0;
			num = 0;
		}
		else
		{
			AskLogs_ExDevice = Settings.Default.gen_AskLogs_ExDevice;
			num = Settings.Default.gen_AskLogs_SameTime;
		}
		int num2 = 0;
		while (withReportIP.Count != 0 && num2 < num)
		{
			string text = withReportIP.Dequeue();
			ListViewItem listViewItem = listView.FindItemWithText(text);
			if (listViewItem != null)
			{
				BeginNetworkAction(listViewItem, NetworkAction.UploadReport);
				num2++;
			}
		}
	}

	private void faceCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		faceListComboBox.Enabled = faceCheckBox.Checked;
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.NetForm));
		this.splitContainer = new System.Windows.Forms.SplitContainer();
		this.listView = new System.Windows.Forms.ListView();
		this.ipColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.shopNameColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.machineNameColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.machineNoColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.typeColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.tableColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.statusColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.numlistColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.macColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.ip2ColumnHeader = new System.Windows.Forms.ColumnHeader();
		this.imageList = new System.Windows.Forms.ImageList(this.components);
		this.tabControl = new System.Windows.Forms.TabControl();
		this.ecsTabPage = new System.Windows.Forms.TabPage();
		this.faceListComboBox = new System.Windows.Forms.ComboBox();
		this.faceListBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.ecsDataSet = new ECS.ECSDataSet();
		this.ecsData_TextBox = new System.Windows.Forms.TextBox();
		this.fontComboBox = new System.Windows.Forms.ComboBox();
		this.vipPointCheckBox = new System.Windows.Forms.CheckBox();
		this.vipCheckBox = new System.Windows.Forms.CheckBox();
		this.tMSbrowseButton = new System.Windows.Forms.Button();
		this.upgradebrowseButton = new System.Windows.Forms.Button();
		this.tMSCheckBox = new System.Windows.Forms.CheckBox();
		this.upgradeCheckBox = new System.Windows.Forms.CheckBox();
		this.tMSFileBox = new System.Windows.Forms.TextBox();
		this.upgradeFileBox = new System.Windows.Forms.TextBox();
		this.custom4CheckBox = new System.Windows.Forms.CheckBox();
		this.custom3CheckBox = new System.Windows.Forms.CheckBox();
		this.custom2CheckBox = new System.Windows.Forms.CheckBox();
		this.custom1CheckBox = new System.Windows.Forms.CheckBox();
		this.saveButton = new System.Windows.Forms.RadioButton();
		this.openButton = new System.Windows.Forms.RadioButton();
		this.bmpCheckBox = new System.Windows.Forms.CheckBox();
		this.deptCheckBox = new System.Windows.Forms.CheckBox();
		this.fontCheckBox = new System.Windows.Forms.CheckBox();
		this.classCheckBox = new System.Windows.Forms.CheckBox();
		this.clearCheckBox = new System.Windows.Forms.CheckBox();
		this.exeButton = new System.Windows.Forms.Button();
		this.wizardCheckBox = new System.Windows.Forms.CheckBox();
		this.selAllCheckBox = new System.Windows.Forms.CheckBox();
		this.unitCheckBox = new System.Windows.Forms.CheckBox();
		this.salesmanCheckBox = new System.Windows.Forms.CheckBox();
		this.faceCheckBox = new System.Windows.Forms.CheckBox();
		this.barcodeCheckBox = new System.Windows.Forms.CheckBox();
		this.stringCheckBox = new System.Windows.Forms.CheckBox();
		this.pLUCheckBox = new System.Windows.Forms.CheckBox();
		this.specCheckBox = new System.Windows.Forms.CheckBox();
		this.labelCheckBox = new System.Windows.Forms.CheckBox();
		this.reportTabPage = new System.Windows.Forms.TabPage();
		this.ReportInfo_TextBox = new System.Windows.Forms.TextBox();
		this.ReportError_TextBox = new System.Windows.Forms.TextBox();
		this.Report2_GroupBox = new System.Windows.Forms.GroupBox();
		this.reCheckBox = new System.Windows.Forms.CheckBox();
		this.repButton = new System.Windows.Forms.Button();
		this.repAllButton = new System.Windows.Forms.Button();
		this.Report1_GroupBox = new System.Windows.Forms.GroupBox();
		this.allDefaultStock_Button = new System.Windows.Forms.Button();
		this.TabledAutoReNumber_CheckBox = new System.Windows.Forms.CheckBox();
		this.specifyStock_Button = new System.Windows.Forms.Button();
		this.nTabledInfo_Label = new System.Windows.Forms.Label();
		this.TabledInfo_Label = new System.Windows.Forms.Label();
		this.nTabledNumber_Label = new System.Windows.Forms.Label();
		this.TabledNumber_Label = new System.Windows.Forms.Label();
		this.showButton = new System.Windows.Forms.Button();
		this.txtPage = new System.Windows.Forms.TabPage();
		this.txtPage_MonitorDelay_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.MonitorDelay_E1_Label = new System.Windows.Forms.Label();
		this.MonitorDelay_B1_Label = new System.Windows.Forms.Label();
		this.txtPage_autoclear_checkbox = new System.Windows.Forms.CheckBox();
		this.txtPage_startup_Button = new System.Windows.Forms.Button();
		this.txtPage_systemtray_Button = new System.Windows.Forms.Button();
		this.txtPage_clear_checkbox = new System.Windows.Forms.CheckBox();
		this.txtPage_auto_checkbox = new System.Windows.Forms.CheckBox();
		this.txtPage_update_checkbox = new System.Windows.Forms.CheckBox();
		this.formtype = new System.Windows.Forms.Label();
		this.formtypeComboBox = new System.Windows.Forms.ComboBox();
		this.formypeBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uiDataSet = new ECS.UIDataSet();
		this.typeTextBox = new System.Windows.Forms.TextBox();
		this.txtfile = new System.Windows.Forms.Label();
		this.txtbrowseButton = new System.Windows.Forms.Button();
		this.txtfileTextBox = new System.Windows.Forms.TextBox();
		this.txtSelAllbutton = new System.Windows.Forms.Button();
		this.txtExebutton = new System.Windows.Forms.Button();
		this.excelPage = new System.Windows.Forms.TabPage();
		this.splitContainer1 = new System.Windows.Forms.SplitContainer();
		this.splitContainer2 = new System.Windows.Forms.SplitContainer();
		this.excelDataGridView = new System.Windows.Forms.DataGridView();
		this.idColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.fieldColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.pLU_ColBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.excelBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.bindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.clearToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.excelDefaultDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.plu_ColbindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.dataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.excelDefaultBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.bindingNavigator1 = new System.Windows.Forms.BindingNavigator(this.components);
		this.toolStripButton1 = new System.Windows.Forms.ToolStripButton();
		this.toolStripLabel1 = new System.Windows.Forms.ToolStripLabel();
		this.toolStripButton2 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton3 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton4 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripTextBox1 = new System.Windows.Forms.ToolStripTextBox();
		this.toolStripSeparator4 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripButton5 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton6 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator5 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripButton7 = new System.Windows.Forms.ToolStripButton();
		this.excelPage_MonitorDelay_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.MonitorDelay_E2_Label = new System.Windows.Forms.Label();
		this.MonitorDelay_B2_Label = new System.Windows.Forms.Label();
		this.excelPage_startup_Button = new System.Windows.Forms.Button();
		this.excelPage_systemtray_Button = new System.Windows.Forms.Button();
		this.excelPage_autoclear_checkbox = new System.Windows.Forms.CheckBox();
		this.excelPage_auto_checkbox = new System.Windows.Forms.CheckBox();
		this.excelbrowseButton = new System.Windows.Forms.Button();
		this.excelfileTextBox = new System.Windows.Forms.TextBox();
		this.excelPage_clear_checkbox = new System.Windows.Forms.CheckBox();
		this.excelPage_update_checkbox = new System.Windows.Forms.CheckBox();
		this.excelSelAllbutton = new System.Windows.Forms.Button();
		this.excelExebutton = new System.Windows.Forms.Button();
		this.mdbTabPage = new System.Windows.Forms.TabPage();
		this.MDBsave_Button = new System.Windows.Forms.Button();
		this.fileComboBox = new System.Windows.Forms.ComboBox();
		this.progressLabel = new System.Windows.Forms.Label();
		this.progressBar = new System.Windows.Forms.ProgressBar();
		this.cancelButton = new System.Windows.Forms.Button();
		this.downloadButton = new System.Windows.Forms.Button();
		this.uploadButton = new System.Windows.Forms.Button();
		this.label1 = new System.Windows.Forms.Label();
		this.passowrdLabel = new System.Windows.Forms.Label();
		this.usernameLabel = new System.Windows.Forms.Label();
		this.uriTextBox = new System.Windows.Forms.TextBox();
		this.passwordTextBox = new System.Windows.Forms.TextBox();
		this.logCheckBox = new System.Windows.Forms.CheckBox();
		this.usernameTextBox = new System.Windows.Forms.TextBox();
		this.labelItemTableAdapter = new ECS.ECSDataSetTableAdapters.LabelItemTableAdapter();
		this.stringTableAdapter = new ECS.ECSDataSetTableAdapters.StringTableAdapter();
		this.specTableAdapter = new ECS.ECSDataSetTableAdapters.SpecTableAdapter();
		this.deptTableAdapter = new ECS.ECSDataSetTableAdapters.DeptTableAdapter();
		this.classTableAdapter = new ECS.ECSDataSetTableAdapters.ClassTableAdapter();
		this.unitTableAdapter = new ECS.ECSDataSetTableAdapters.UnitTableAdapter();
		this.barcodeTableAdapter = new ECS.ECSDataSetTableAdapters.BarcodeTableAdapter();
		this.salesmanTableAdapter = new ECS.ECSDataSetTableAdapters.SalesmanTableAdapter();
		this.labelTableAdapter = new ECS.ECSDataSetTableAdapters.LabelTableAdapter();
		this.faceTableAdapter = new ECS.ECSDataSetTableAdapters.FaceTableAdapter();
		this.pLUTableAdapter = new ECS.ECSDataSetTableAdapters.PLUTableAdapter();
		this.webClient = new System.Net.WebClient();
		this.custom1TableAdapter = new ECS.ECSDataSetTableAdapters.Custom1TableAdapter();
		this.custom2TableAdapter = new ECS.ECSDataSetTableAdapters.Custom2TableAdapter();
		this.custom3TableAdapter = new ECS.ECSDataSetTableAdapters.Custom3TableAdapter();
		this.custom4TableAdapter = new ECS.ECSDataSetTableAdapters.Custom4TableAdapter();
		this.excelDefaultTableAdapter = new ECS.ECSDataSetTableAdapters.ExcelDefaultTableAdapter();
		this.unitTableAdapter1 = new ECS.ECSDataSetTableAdapters.UnitTableAdapter();
		this.excelTableAdapter = new ECS.ECSDataSetTableAdapters.ExcelTableAdapter();
		this.vipTableAdapter = new ECS.ECSDataSetTableAdapters.VIPTableAdapter();
		this.faceListTableAdapter = new ECS.ECSDataSetTableAdapters.FaceListTableAdapter();
		this.deviceTableAdapter = new ECS.ReportDataSetTableAdapters.DeviceTableAdapter();
		this.BottomToolStripPanel = new System.Windows.Forms.ToolStripPanel();
		this.TopToolStripPanel = new System.Windows.Forms.ToolStripPanel();
		this.RightToolStripPanel = new System.Windows.Forms.ToolStripPanel();
		this.LeftToolStripPanel = new System.Windows.Forms.ToolStripPanel();
		this.ContentPanel = new System.Windows.Forms.ToolStripContentPanel();
		this.toolStrip = new System.Windows.Forms.ToolStrip();
		this.addToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.deleteToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.findToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.shutToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator3 = new System.Windows.Forms.ToolStripSeparator();
		this.taskToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.selAllToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.cancelToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.timeToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.renameToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.ipToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.MAC_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.MACr_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.expandshrink_ToolStrip = new System.Windows.Forms.ToolStrip();
		this.ethernet_ToolStripLabel = new System.Windows.Forms.ToolStripLabel();
		this.expand_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.shrink_ToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.reportTimer = new System.Windows.Forms.Timer(this.components);
		this.splitContainer.Panel1.SuspendLayout();
		this.splitContainer.Panel2.SuspendLayout();
		this.splitContainer.SuspendLayout();
		this.tabControl.SuspendLayout();
		this.ecsTabPage.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.faceListBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).BeginInit();
		this.reportTabPage.SuspendLayout();
		this.Report2_GroupBox.SuspendLayout();
		this.Report1_GroupBox.SuspendLayout();
		this.txtPage.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.txtPage_MonitorDelay_NumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.formypeBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		this.excelPage.SuspendLayout();
		this.splitContainer1.Panel1.SuspendLayout();
		this.splitContainer1.Panel2.SuspendLayout();
		this.splitContainer1.SuspendLayout();
		this.splitContainer2.Panel1.SuspendLayout();
		this.splitContainer2.Panel2.SuspendLayout();
		this.splitContainer2.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.excelDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLU_ColBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.excelBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.bindingNavigator).BeginInit();
		this.bindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.excelDefaultDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.plu_ColbindingSource1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.excelDefaultBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.bindingNavigator1).BeginInit();
		this.bindingNavigator1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.excelPage_MonitorDelay_NumericUpDown).BeginInit();
		this.mdbTabPage.SuspendLayout();
		this.toolStrip.SuspendLayout();
		this.expandshrink_ToolStrip.SuspendLayout();
		base.SuspendLayout();
		this.splitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer, "splitContainer");
		this.splitContainer.Name = "splitContainer";
		this.splitContainer.Panel1.Controls.Add(this.listView);
		resources.ApplyResources(this.splitContainer.Panel2, "splitContainer.Panel2");
		this.splitContainer.Panel2.Controls.Add(this.tabControl);
		this.listView.CheckBoxes = true;
		this.listView.Columns.AddRange(new System.Windows.Forms.ColumnHeader[10] { this.ipColumnHeader, this.shopNameColumnHeader, this.machineNameColumnHeader, this.machineNoColumnHeader, this.typeColumnHeader, this.tableColumnHeader, this.statusColumnHeader, this.numlistColumnHeader, this.macColumnHeader, this.ip2ColumnHeader });
		resources.ApplyResources(this.listView, "listView");
		this.listView.FullRowSelect = true;
		this.listView.HideSelection = false;
		this.listView.MultiSelect = false;
		this.listView.Name = "listView";
		this.listView.ShowGroups = false;
		this.listView.SmallImageList = this.imageList;
		this.listView.UseCompatibleStateImageBehavior = false;
		this.listView.View = System.Windows.Forms.View.Details;
		this.listView.ColumnClick += new System.Windows.Forms.ColumnClickEventHandler(listView_ColumnClick);
		this.listView.ItemCheck += new System.Windows.Forms.ItemCheckEventHandler(listView_ItemCheck);
		this.listView.ItemChecked += new System.Windows.Forms.ItemCheckedEventHandler(listView_ItemChecked);
		this.listView.SelectedIndexChanged += new System.EventHandler(listView_SelectedIndexChanged);
		resources.ApplyResources(this.ipColumnHeader, "ipColumnHeader");
		resources.ApplyResources(this.shopNameColumnHeader, "shopNameColumnHeader");
		resources.ApplyResources(this.machineNameColumnHeader, "machineNameColumnHeader");
		resources.ApplyResources(this.machineNoColumnHeader, "machineNoColumnHeader");
		resources.ApplyResources(this.typeColumnHeader, "typeColumnHeader");
		resources.ApplyResources(this.tableColumnHeader, "tableColumnHeader");
		resources.ApplyResources(this.statusColumnHeader, "statusColumnHeader");
		resources.ApplyResources(this.numlistColumnHeader, "numlistColumnHeader");
		resources.ApplyResources(this.macColumnHeader, "macColumnHeader");
		resources.ApplyResources(this.ip2ColumnHeader, "ip2ColumnHeader");
		this.imageList.ImageStream = (System.Windows.Forms.ImageListStreamer)resources.GetObject("imageList.ImageStream");
		this.imageList.TransparentColor = System.Drawing.Color.Transparent;
		this.imageList.Images.SetKeyName(0, "Flag_blue");
		this.imageList.Images.SetKeyName(1, "Flag_gray");
		this.imageList.Images.SetKeyName(2, "Flag_green");
		this.imageList.Images.SetKeyName(3, "Flag_red");
		this.tabControl.Controls.Add(this.ecsTabPage);
		this.tabControl.Controls.Add(this.reportTabPage);
		this.tabControl.Controls.Add(this.txtPage);
		this.tabControl.Controls.Add(this.excelPage);
		this.tabControl.Controls.Add(this.mdbTabPage);
		resources.ApplyResources(this.tabControl, "tabControl");
		this.tabControl.Name = "tabControl";
		this.tabControl.SelectedIndex = 0;
		resources.ApplyResources(this.ecsTabPage, "ecsTabPage");
		this.ecsTabPage.Controls.Add(this.faceListComboBox);
		this.ecsTabPage.Controls.Add(this.ecsData_TextBox);
		this.ecsTabPage.Controls.Add(this.fontComboBox);
		this.ecsTabPage.Controls.Add(this.vipPointCheckBox);
		this.ecsTabPage.Controls.Add(this.vipCheckBox);
		this.ecsTabPage.Controls.Add(this.tMSbrowseButton);
		this.ecsTabPage.Controls.Add(this.upgradebrowseButton);
		this.ecsTabPage.Controls.Add(this.tMSCheckBox);
		this.ecsTabPage.Controls.Add(this.upgradeCheckBox);
		this.ecsTabPage.Controls.Add(this.tMSFileBox);
		this.ecsTabPage.Controls.Add(this.upgradeFileBox);
		this.ecsTabPage.Controls.Add(this.custom4CheckBox);
		this.ecsTabPage.Controls.Add(this.custom3CheckBox);
		this.ecsTabPage.Controls.Add(this.custom2CheckBox);
		this.ecsTabPage.Controls.Add(this.custom1CheckBox);
		this.ecsTabPage.Controls.Add(this.saveButton);
		this.ecsTabPage.Controls.Add(this.openButton);
		this.ecsTabPage.Controls.Add(this.bmpCheckBox);
		this.ecsTabPage.Controls.Add(this.deptCheckBox);
		this.ecsTabPage.Controls.Add(this.fontCheckBox);
		this.ecsTabPage.Controls.Add(this.classCheckBox);
		this.ecsTabPage.Controls.Add(this.clearCheckBox);
		this.ecsTabPage.Controls.Add(this.exeButton);
		this.ecsTabPage.Controls.Add(this.wizardCheckBox);
		this.ecsTabPage.Controls.Add(this.selAllCheckBox);
		this.ecsTabPage.Controls.Add(this.unitCheckBox);
		this.ecsTabPage.Controls.Add(this.salesmanCheckBox);
		this.ecsTabPage.Controls.Add(this.faceCheckBox);
		this.ecsTabPage.Controls.Add(this.barcodeCheckBox);
		this.ecsTabPage.Controls.Add(this.stringCheckBox);
		this.ecsTabPage.Controls.Add(this.pLUCheckBox);
		this.ecsTabPage.Controls.Add(this.specCheckBox);
		this.ecsTabPage.Controls.Add(this.labelCheckBox);
		this.ecsTabPage.Name = "ecsTabPage";
		this.ecsTabPage.UseVisualStyleBackColor = true;
		this.faceListComboBox.DataSource = this.faceListBindingSource;
		this.faceListComboBox.DisplayMember = "ScaleID";
		this.faceListComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		resources.ApplyResources(this.faceListComboBox, "faceListComboBox");
		this.faceListComboBox.FormattingEnabled = true;
		this.faceListComboBox.Name = "faceListComboBox";
		this.faceListComboBox.ValueMember = "ScaleID";
		this.faceListBindingSource.DataMember = "FaceList";
		this.faceListBindingSource.DataSource = this.ecsDataSet;
		this.ecsDataSet.DataSetName = "ECSDataSet";
		this.ecsDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.ecsData_TextBox, "ecsData_TextBox");
		this.ecsData_TextBox.Name = "ecsData_TextBox";
		this.ecsData_TextBox.ReadOnly = true;
		this.ecsData_TextBox.TextChanged += new System.EventHandler(ecsData_TextBox_TextChanged);
		this.fontComboBox.DropDownWidth = 200;
		resources.ApplyResources(this.fontComboBox, "fontComboBox");
		this.fontComboBox.FormattingEnabled = true;
		this.fontComboBox.Name = "fontComboBox";
		resources.ApplyResources(this.vipPointCheckBox, "vipPointCheckBox");
		this.vipPointCheckBox.Name = "vipPointCheckBox";
		this.vipPointCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.vipCheckBox, "vipCheckBox");
		this.vipCheckBox.Name = "vipCheckBox";
		this.vipCheckBox.UseVisualStyleBackColor = true;
		this.vipCheckBox.CheckedChanged += new System.EventHandler(vipCheckBox_CheckedChanged);
		resources.ApplyResources(this.tMSbrowseButton, "tMSbrowseButton");
		this.tMSbrowseButton.Name = "tMSbrowseButton";
		this.tMSbrowseButton.UseVisualStyleBackColor = true;
		this.tMSbrowseButton.Click += new System.EventHandler(tMSbrowseButton_Click);
		resources.ApplyResources(this.upgradebrowseButton, "upgradebrowseButton");
		this.upgradebrowseButton.Name = "upgradebrowseButton";
		this.upgradebrowseButton.UseVisualStyleBackColor = true;
		this.upgradebrowseButton.Click += new System.EventHandler(upgradebrowseButton_Click);
		resources.ApplyResources(this.tMSCheckBox, "tMSCheckBox");
		this.tMSCheckBox.Name = "tMSCheckBox";
		this.tMSCheckBox.UseVisualStyleBackColor = true;
		this.tMSCheckBox.CheckedChanged += new System.EventHandler(tMSCheckBox_CheckedChanged);
		resources.ApplyResources(this.upgradeCheckBox, "upgradeCheckBox");
		this.upgradeCheckBox.Name = "upgradeCheckBox";
		this.upgradeCheckBox.UseVisualStyleBackColor = true;
		this.upgradeCheckBox.CheckedChanged += new System.EventHandler(upgradeCheckBox_CheckedChanged);
		resources.ApplyResources(this.tMSFileBox, "tMSFileBox");
		this.tMSFileBox.Name = "tMSFileBox";
		resources.ApplyResources(this.upgradeFileBox, "upgradeFileBox");
		this.upgradeFileBox.Name = "upgradeFileBox";
		resources.ApplyResources(this.custom4CheckBox, "custom4CheckBox");
		this.custom4CheckBox.Name = "custom4CheckBox";
		this.custom4CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.custom3CheckBox, "custom3CheckBox");
		this.custom3CheckBox.Name = "custom3CheckBox";
		this.custom3CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.custom2CheckBox, "custom2CheckBox");
		this.custom2CheckBox.Name = "custom2CheckBox";
		this.custom2CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.custom1CheckBox, "custom1CheckBox");
		this.custom1CheckBox.Name = "custom1CheckBox";
		this.custom1CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.saveButton, "saveButton");
		this.saveButton.Name = "saveButton";
		this.saveButton.UseVisualStyleBackColor = true;
		this.saveButton.CheckedChanged += new System.EventHandler(saveButton_CheckedChanged);
		resources.ApplyResources(this.openButton, "openButton");
		this.openButton.Name = "openButton";
		this.openButton.UseVisualStyleBackColor = true;
		this.openButton.CheckedChanged += new System.EventHandler(saveButton_CheckedChanged);
		resources.ApplyResources(this.bmpCheckBox, "bmpCheckBox");
		this.bmpCheckBox.Name = "bmpCheckBox";
		this.bmpCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.deptCheckBox, "deptCheckBox");
		this.deptCheckBox.Name = "deptCheckBox";
		this.deptCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.fontCheckBox, "fontCheckBox");
		this.fontCheckBox.Name = "fontCheckBox";
		this.fontCheckBox.UseVisualStyleBackColor = true;
		this.fontCheckBox.CheckedChanged += new System.EventHandler(fontCheckBox_CheckedChanged);
		resources.ApplyResources(this.classCheckBox, "classCheckBox");
		this.classCheckBox.Name = "classCheckBox";
		this.classCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.clearCheckBox, "clearCheckBox");
		this.clearCheckBox.Name = "clearCheckBox";
		this.clearCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.exeButton, "exeButton");
		this.exeButton.Name = "exeButton";
		this.exeButton.UseVisualStyleBackColor = true;
		this.exeButton.Click += new System.EventHandler(exeButton_Click);
		resources.ApplyResources(this.wizardCheckBox, "wizardCheckBox");
		this.wizardCheckBox.ForeColor = System.Drawing.Color.Red;
		this.wizardCheckBox.Name = "wizardCheckBox";
		this.wizardCheckBox.UseVisualStyleBackColor = true;
		this.wizardCheckBox.CheckedChanged += new System.EventHandler(quicksetCheckBox_CheckedChanged);
		resources.ApplyResources(this.selAllCheckBox, "selAllCheckBox");
		this.selAllCheckBox.Name = "selAllCheckBox";
		this.selAllCheckBox.UseVisualStyleBackColor = true;
		this.selAllCheckBox.CheckedChanged += new System.EventHandler(selAllCheckBox_CheckedChanged);
		resources.ApplyResources(this.unitCheckBox, "unitCheckBox");
		this.unitCheckBox.Name = "unitCheckBox";
		this.unitCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.salesmanCheckBox, "salesmanCheckBox");
		this.salesmanCheckBox.Name = "salesmanCheckBox";
		this.salesmanCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.faceCheckBox, "faceCheckBox");
		this.faceCheckBox.Name = "faceCheckBox";
		this.faceCheckBox.UseVisualStyleBackColor = true;
		this.faceCheckBox.CheckedChanged += new System.EventHandler(faceCheckBox_CheckedChanged);
		resources.ApplyResources(this.barcodeCheckBox, "barcodeCheckBox");
		this.barcodeCheckBox.Name = "barcodeCheckBox";
		this.barcodeCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.stringCheckBox, "stringCheckBox");
		this.stringCheckBox.Name = "stringCheckBox";
		this.stringCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.pLUCheckBox, "pLUCheckBox");
		this.pLUCheckBox.Name = "pLUCheckBox";
		this.pLUCheckBox.ThreeState = true;
		this.pLUCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.specCheckBox, "specCheckBox");
		this.specCheckBox.Name = "specCheckBox";
		this.specCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.labelCheckBox, "labelCheckBox");
		this.labelCheckBox.Name = "labelCheckBox";
		this.labelCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.reportTabPage, "reportTabPage");
		this.reportTabPage.Controls.Add(this.ReportInfo_TextBox);
		this.reportTabPage.Controls.Add(this.ReportError_TextBox);
		this.reportTabPage.Controls.Add(this.Report2_GroupBox);
		this.reportTabPage.Controls.Add(this.Report1_GroupBox);
		this.reportTabPage.Controls.Add(this.nTabledInfo_Label);
		this.reportTabPage.Controls.Add(this.TabledInfo_Label);
		this.reportTabPage.Controls.Add(this.nTabledNumber_Label);
		this.reportTabPage.Controls.Add(this.TabledNumber_Label);
		this.reportTabPage.Controls.Add(this.showButton);
		this.reportTabPage.Name = "reportTabPage";
		this.reportTabPage.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.ReportInfo_TextBox, "ReportInfo_TextBox");
		this.ReportInfo_TextBox.Name = "ReportInfo_TextBox";
		this.ReportInfo_TextBox.ReadOnly = true;
		this.ReportInfo_TextBox.TextChanged += new System.EventHandler(ReportInfo_TextBox_TextChanged);
		resources.ApplyResources(this.ReportError_TextBox, "ReportError_TextBox");
		this.ReportError_TextBox.Name = "ReportError_TextBox";
		this.ReportError_TextBox.ReadOnly = true;
		this.ReportError_TextBox.TextChanged += new System.EventHandler(ReportError_TextBox_TextChanged);
		this.Report2_GroupBox.Controls.Add(this.reCheckBox);
		this.Report2_GroupBox.Controls.Add(this.repButton);
		this.Report2_GroupBox.Controls.Add(this.repAllButton);
		resources.ApplyResources(this.Report2_GroupBox, "Report2_GroupBox");
		this.Report2_GroupBox.Name = "Report2_GroupBox";
		this.Report2_GroupBox.TabStop = false;
		resources.ApplyResources(this.reCheckBox, "reCheckBox");
		this.reCheckBox.Name = "reCheckBox";
		this.reCheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.repButton, "repButton");
		this.repButton.Name = "repButton";
		this.repButton.UseVisualStyleBackColor = true;
		this.repButton.Click += new System.EventHandler(repButton_Click);
		resources.ApplyResources(this.repAllButton, "repAllButton");
		this.repAllButton.Name = "repAllButton";
		this.repAllButton.UseVisualStyleBackColor = true;
		this.repAllButton.Click += new System.EventHandler(repAllButton_Click);
		this.Report1_GroupBox.Controls.Add(this.allDefaultStock_Button);
		this.Report1_GroupBox.Controls.Add(this.TabledAutoReNumber_CheckBox);
		this.Report1_GroupBox.Controls.Add(this.specifyStock_Button);
		resources.ApplyResources(this.Report1_GroupBox, "Report1_GroupBox");
		this.Report1_GroupBox.Name = "Report1_GroupBox";
		this.Report1_GroupBox.TabStop = false;
		resources.ApplyResources(this.allDefaultStock_Button, "allDefaultStock_Button");
		this.allDefaultStock_Button.Name = "allDefaultStock_Button";
		this.allDefaultStock_Button.UseVisualStyleBackColor = true;
		this.allDefaultStock_Button.Click += new System.EventHandler(TabledAuto_Button_Click);
		resources.ApplyResources(this.TabledAutoReNumber_CheckBox, "TabledAutoReNumber_CheckBox");
		this.TabledAutoReNumber_CheckBox.Checked = true;
		this.TabledAutoReNumber_CheckBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.TabledAutoReNumber_CheckBox.Name = "TabledAutoReNumber_CheckBox";
		this.TabledAutoReNumber_CheckBox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.specifyStock_Button, "specifyStock_Button");
		this.specifyStock_Button.Name = "specifyStock_Button";
		this.specifyStock_Button.UseVisualStyleBackColor = true;
		this.specifyStock_Button.Click += new System.EventHandler(ExistStock_Button_Click);
		resources.ApplyResources(this.nTabledInfo_Label, "nTabledInfo_Label");
		this.nTabledInfo_Label.Name = "nTabledInfo_Label";
		resources.ApplyResources(this.TabledInfo_Label, "TabledInfo_Label");
		this.TabledInfo_Label.Name = "TabledInfo_Label";
		resources.ApplyResources(this.nTabledNumber_Label, "nTabledNumber_Label");
		this.nTabledNumber_Label.Name = "nTabledNumber_Label";
		resources.ApplyResources(this.TabledNumber_Label, "TabledNumber_Label");
		this.TabledNumber_Label.Name = "TabledNumber_Label";
		resources.ApplyResources(this.showButton, "showButton");
		this.showButton.Name = "showButton";
		this.showButton.UseVisualStyleBackColor = true;
		this.showButton.Click += new System.EventHandler(showButton_Click);
		resources.ApplyResources(this.txtPage, "txtPage");
		this.txtPage.Controls.Add(this.txtPage_MonitorDelay_NumericUpDown);
		this.txtPage.Controls.Add(this.MonitorDelay_E1_Label);
		this.txtPage.Controls.Add(this.MonitorDelay_B1_Label);
		this.txtPage.Controls.Add(this.txtPage_autoclear_checkbox);
		this.txtPage.Controls.Add(this.txtPage_startup_Button);
		this.txtPage.Controls.Add(this.txtPage_systemtray_Button);
		this.txtPage.Controls.Add(this.txtPage_clear_checkbox);
		this.txtPage.Controls.Add(this.txtPage_auto_checkbox);
		this.txtPage.Controls.Add(this.txtPage_update_checkbox);
		this.txtPage.Controls.Add(this.formtype);
		this.txtPage.Controls.Add(this.formtypeComboBox);
		this.txtPage.Controls.Add(this.typeTextBox);
		this.txtPage.Controls.Add(this.txtfile);
		this.txtPage.Controls.Add(this.txtbrowseButton);
		this.txtPage.Controls.Add(this.txtfileTextBox);
		this.txtPage.Controls.Add(this.txtSelAllbutton);
		this.txtPage.Controls.Add(this.txtExebutton);
		this.txtPage.Name = "txtPage";
		this.txtPage.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.txtPage_MonitorDelay_NumericUpDown, "txtPage_MonitorDelay_NumericUpDown");
		this.txtPage_MonitorDelay_NumericUpDown.Name = "txtPage_MonitorDelay_NumericUpDown";
		resources.ApplyResources(this.MonitorDelay_E1_Label, "MonitorDelay_E1_Label");
		this.MonitorDelay_E1_Label.Name = "MonitorDelay_E1_Label";
		resources.ApplyResources(this.MonitorDelay_B1_Label, "MonitorDelay_B1_Label");
		this.MonitorDelay_B1_Label.Name = "MonitorDelay_B1_Label";
		resources.ApplyResources(this.txtPage_autoclear_checkbox, "txtPage_autoclear_checkbox");
		this.txtPage_autoclear_checkbox.Name = "txtPage_autoclear_checkbox";
		this.txtPage_autoclear_checkbox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.txtPage_startup_Button, "txtPage_startup_Button");
		this.txtPage_startup_Button.Name = "txtPage_startup_Button";
		this.txtPage_startup_Button.UseVisualStyleBackColor = true;
		this.txtPage_startup_Button.Click += new System.EventHandler(txtPage_startup_Button_Click);
		resources.ApplyResources(this.txtPage_systemtray_Button, "txtPage_systemtray_Button");
		this.txtPage_systemtray_Button.Name = "txtPage_systemtray_Button";
		this.txtPage_systemtray_Button.UseVisualStyleBackColor = true;
		this.txtPage_systemtray_Button.Click += new System.EventHandler(txtPage_systemtray_Button_Click);
		resources.ApplyResources(this.txtPage_clear_checkbox, "txtPage_clear_checkbox");
		this.txtPage_clear_checkbox.Name = "txtPage_clear_checkbox";
		this.txtPage_clear_checkbox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.txtPage_auto_checkbox, "txtPage_auto_checkbox");
		this.txtPage_auto_checkbox.Name = "txtPage_auto_checkbox";
		this.txtPage_auto_checkbox.UseVisualStyleBackColor = true;
		this.txtPage_auto_checkbox.CheckedChanged += new System.EventHandler(txtPage_auto_checkbox_CheckedChanged);
		resources.ApplyResources(this.txtPage_update_checkbox, "txtPage_update_checkbox");
		this.txtPage_update_checkbox.Name = "txtPage_update_checkbox";
		this.txtPage_update_checkbox.UseVisualStyleBackColor = true;
		this.txtPage_update_checkbox.CheckedChanged += new System.EventHandler(txtPage_update_checkbox_CheckedChanged);
		resources.ApplyResources(this.formtype, "formtype");
		this.formtype.Name = "formtype";
		this.formtypeComboBox.DataSource = this.formypeBindingSource;
		this.formtypeComboBox.DisplayMember = "Display";
		this.formtypeComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.formtypeComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.formtypeComboBox, "formtypeComboBox");
		this.formtypeComboBox.Name = "formtypeComboBox";
		this.formtypeComboBox.ValueMember = "Format";
		this.formtypeComboBox.SelectedIndexChanged += new System.EventHandler(formtypeComboBox_SelectedIndexChanged);
		this.formypeBindingSource.DataMember = "TXTForm_Type";
		this.formypeBindingSource.DataSource = this.uiDataSet;
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.typeTextBox.AcceptsReturn = true;
		this.typeTextBox.AcceptsTab = true;
		resources.ApplyResources(this.typeTextBox, "typeTextBox");
		this.typeTextBox.Name = "typeTextBox";
		this.typeTextBox.TextChanged += new System.EventHandler(typeTextBox_TextChanged);
		resources.ApplyResources(this.txtfile, "txtfile");
		this.txtfile.Name = "txtfile";
		resources.ApplyResources(this.txtbrowseButton, "txtbrowseButton");
		this.txtbrowseButton.Name = "txtbrowseButton";
		this.txtbrowseButton.UseVisualStyleBackColor = true;
		this.txtbrowseButton.Click += new System.EventHandler(txtbrowseButton_Click);
		resources.ApplyResources(this.txtfileTextBox, "txtfileTextBox");
		this.txtfileTextBox.Name = "txtfileTextBox";
		this.txtfileTextBox.TextChanged += new System.EventHandler(filenameTextBox_TextChanged);
		this.txtSelAllbutton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.txtSelAllbutton, "txtSelAllbutton");
		this.txtSelAllbutton.Name = "txtSelAllbutton";
		this.txtSelAllbutton.UseVisualStyleBackColor = true;
		this.txtSelAllbutton.Click += new System.EventHandler(txtSelAllbutton_Click);
		this.txtExebutton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.txtExebutton, "txtExebutton");
		this.txtExebutton.Name = "txtExebutton";
		this.txtExebutton.UseVisualStyleBackColor = true;
		this.txtExebutton.Click += new System.EventHandler(txtExebutton_Click);
		resources.ApplyResources(this.excelPage, "excelPage");
		this.excelPage.Controls.Add(this.splitContainer1);
		this.excelPage.Name = "excelPage";
		this.excelPage.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.splitContainer1, "splitContainer1");
		this.splitContainer1.Name = "splitContainer1";
		this.splitContainer1.Panel1.Controls.Add(this.splitContainer2);
		resources.ApplyResources(this.splitContainer1.Panel2, "splitContainer1.Panel2");
		this.splitContainer1.Panel2.Controls.Add(this.excelPage_MonitorDelay_NumericUpDown);
		this.splitContainer1.Panel2.Controls.Add(this.MonitorDelay_E2_Label);
		this.splitContainer1.Panel2.Controls.Add(this.MonitorDelay_B2_Label);
		this.splitContainer1.Panel2.Controls.Add(this.excelPage_startup_Button);
		this.splitContainer1.Panel2.Controls.Add(this.excelPage_systemtray_Button);
		this.splitContainer1.Panel2.Controls.Add(this.excelPage_autoclear_checkbox);
		this.splitContainer1.Panel2.Controls.Add(this.excelPage_auto_checkbox);
		this.splitContainer1.Panel2.Controls.Add(this.excelbrowseButton);
		this.splitContainer1.Panel2.Controls.Add(this.excelfileTextBox);
		this.splitContainer1.Panel2.Controls.Add(this.excelPage_clear_checkbox);
		this.splitContainer1.Panel2.Controls.Add(this.excelPage_update_checkbox);
		this.splitContainer1.Panel2.Controls.Add(this.excelSelAllbutton);
		this.splitContainer1.Panel2.Controls.Add(this.excelExebutton);
		resources.ApplyResources(this.splitContainer2, "splitContainer2");
		this.splitContainer2.Name = "splitContainer2";
		this.splitContainer2.Panel1.Controls.Add(this.excelDataGridView);
		this.splitContainer2.Panel1.Controls.Add(this.bindingNavigator);
		resources.ApplyResources(this.splitContainer2.Panel2, "splitContainer2.Panel2");
		this.splitContainer2.Panel2.Controls.Add(this.excelDefaultDataGridView);
		this.splitContainer2.Panel2.Controls.Add(this.bindingNavigator1);
		this.excelDataGridView.AllowUserToAddRows = false;
		this.excelDataGridView.AutoGenerateColumns = false;
		this.excelDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.excelDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.excelDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.excelDataGridView.Columns.AddRange(this.idColumn, this.fieldColumn);
		this.excelDataGridView.DataSource = this.excelBindingSource;
		resources.ApplyResources(this.excelDataGridView, "excelDataGridView");
		this.excelDataGridView.Name = "excelDataGridView";
		this.excelDataGridView.RowTemplate.Height = 23;
		this.excelDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.idColumn.DataPropertyName = "ID";
		resources.ApplyResources(this.idColumn, "idColumn");
		this.idColumn.Name = "idColumn";
		this.fieldColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.fieldColumn.DataPropertyName = "Field";
		this.fieldColumn.DataSource = this.pLU_ColBindingSource;
		this.fieldColumn.DisplayMember = "Display";
		resources.ApplyResources(this.fieldColumn, "fieldColumn");
		this.fieldColumn.Name = "fieldColumn";
		this.fieldColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.fieldColumn.ValueMember = "Field";
		this.pLU_ColBindingSource.DataMember = "PLU_Col";
		this.pLU_ColBindingSource.DataSource = this.uiDataSet;
		this.excelBindingSource.DataMember = "Excel";
		this.excelBindingSource.DataSource = this.ecsDataSet;
		this.bindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem;
		this.bindingNavigator.BindingSource = this.excelBindingSource;
		this.bindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.bindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem;
		this.bindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[12]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem, this.clearToolStripButton
		});
		resources.ApplyResources(this.bindingNavigator, "bindingNavigator");
		this.bindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.bindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.bindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.bindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.bindingNavigator.Name = "bindingNavigator";
		this.bindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		resources.ApplyResources(this.bindingNavigatorCountItem, "bindingNavigatorCountItem");
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		this.bindingNavigatorMoveFirstItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem, "bindingNavigatorMoveFirstItem");
		this.bindingNavigatorMoveFirstItem.Name = "bindingNavigatorMoveFirstItem";
		this.bindingNavigatorMovePreviousItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem, "bindingNavigatorMovePreviousItem");
		this.bindingNavigatorMovePreviousItem.Name = "bindingNavigatorMovePreviousItem";
		this.bindingNavigatorSeparator.Name = "bindingNavigatorSeparator";
		resources.ApplyResources(this.bindingNavigatorSeparator, "bindingNavigatorSeparator");
		resources.ApplyResources(this.bindingNavigatorPositionItem, "bindingNavigatorPositionItem");
		this.bindingNavigatorPositionItem.Name = "bindingNavigatorPositionItem";
		this.bindingNavigatorSeparator1.Name = "bindingNavigatorSeparator1";
		resources.ApplyResources(this.bindingNavigatorSeparator1, "bindingNavigatorSeparator1");
		this.bindingNavigatorMoveNextItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem, "bindingNavigatorMoveNextItem");
		this.bindingNavigatorMoveNextItem.Name = "bindingNavigatorMoveNextItem";
		this.bindingNavigatorMoveLastItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem, "bindingNavigatorMoveLastItem");
		this.bindingNavigatorMoveLastItem.Name = "bindingNavigatorMoveLastItem";
		this.bindingNavigatorSeparator2.Name = "bindingNavigatorSeparator2";
		resources.ApplyResources(this.bindingNavigatorSeparator2, "bindingNavigatorSeparator2");
		resources.ApplyResources(this.clearToolStripButton, "clearToolStripButton");
		this.clearToolStripButton.Name = "clearToolStripButton";
		this.excelDefaultDataGridView.AllowUserToAddRows = false;
		this.excelDefaultDataGridView.AutoGenerateColumns = false;
		this.excelDefaultDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.excelDefaultDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.excelDefaultDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.excelDefaultDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn1, this.dataGridViewTextBoxColumn2, this.dataGridViewTextBoxColumn3);
		this.excelDefaultDataGridView.DataSource = this.excelDefaultBindingSource;
		resources.ApplyResources(this.excelDefaultDataGridView, "excelDefaultDataGridView");
		this.excelDefaultDataGridView.Name = "excelDefaultDataGridView";
		this.excelDefaultDataGridView.RowTemplate.Height = 23;
		this.excelDefaultDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.dataGridViewTextBoxColumn1.DataPropertyName = "ID";
		resources.ApplyResources(this.dataGridViewTextBoxColumn1, "dataGridViewTextBoxColumn1");
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.dataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn2.DataPropertyName = "Field";
		this.dataGridViewTextBoxColumn2.DataSource = this.plu_ColbindingSource1;
		this.dataGridViewTextBoxColumn2.DisplayMember = "Display";
		resources.ApplyResources(this.dataGridViewTextBoxColumn2, "dataGridViewTextBoxColumn2");
		this.dataGridViewTextBoxColumn2.Name = "dataGridViewTextBoxColumn2";
		this.dataGridViewTextBoxColumn2.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.dataGridViewTextBoxColumn2.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.dataGridViewTextBoxColumn2.ValueMember = "Field";
		this.plu_ColbindingSource1.DataMember = "PLU_Col";
		this.plu_ColbindingSource1.DataSource = this.uiDataSet;
		this.plu_ColbindingSource1.Filter = "[Field] <> '' AND [Field] <> 'PLUID'";
		this.dataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn3.DataPropertyName = "Default";
		resources.ApplyResources(this.dataGridViewTextBoxColumn3, "dataGridViewTextBoxColumn3");
		this.dataGridViewTextBoxColumn3.Name = "dataGridViewTextBoxColumn3";
		this.excelDefaultBindingSource.DataMember = "ExcelDefault";
		this.excelDefaultBindingSource.DataSource = this.ecsDataSet;
		this.bindingNavigator1.AddNewItem = this.toolStripButton1;
		this.bindingNavigator1.BindingSource = this.excelDefaultBindingSource;
		this.bindingNavigator1.CountItem = this.toolStripLabel1;
		this.bindingNavigator1.DeleteItem = this.toolStripButton2;
		this.bindingNavigator1.Items.AddRange(new System.Windows.Forms.ToolStripItem[12]
		{
			this.toolStripButton3, this.toolStripButton4, this.toolStripSeparator2, this.toolStripTextBox1, this.toolStripLabel1, this.toolStripSeparator4, this.toolStripButton5, this.toolStripButton6, this.toolStripSeparator5, this.toolStripButton1,
			this.toolStripButton2, this.toolStripButton7
		});
		resources.ApplyResources(this.bindingNavigator1, "bindingNavigator1");
		this.bindingNavigator1.MoveFirstItem = this.toolStripButton3;
		this.bindingNavigator1.MoveLastItem = this.toolStripButton6;
		this.bindingNavigator1.MoveNextItem = this.toolStripButton5;
		this.bindingNavigator1.MovePreviousItem = this.toolStripButton4;
		this.bindingNavigator1.Name = "bindingNavigator1";
		this.bindingNavigator1.PositionItem = this.toolStripTextBox1;
		this.toolStripButton1.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.toolStripButton1, "toolStripButton1");
		this.toolStripButton1.Name = "toolStripButton1";
		this.toolStripLabel1.Name = "toolStripLabel1";
		resources.ApplyResources(this.toolStripLabel1, "toolStripLabel1");
		this.toolStripButton2.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.toolStripButton2, "toolStripButton2");
		this.toolStripButton2.Name = "toolStripButton2";
		this.toolStripButton3.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.toolStripButton3, "toolStripButton3");
		this.toolStripButton3.Name = "toolStripButton3";
		this.toolStripButton4.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.toolStripButton4, "toolStripButton4");
		this.toolStripButton4.Name = "toolStripButton4";
		this.toolStripSeparator2.Name = "toolStripSeparator2";
		resources.ApplyResources(this.toolStripSeparator2, "toolStripSeparator2");
		resources.ApplyResources(this.toolStripTextBox1, "toolStripTextBox1");
		this.toolStripTextBox1.Name = "toolStripTextBox1";
		this.toolStripSeparator4.Name = "toolStripSeparator4";
		resources.ApplyResources(this.toolStripSeparator4, "toolStripSeparator4");
		this.toolStripButton5.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.toolStripButton5, "toolStripButton5");
		this.toolStripButton5.Name = "toolStripButton5";
		this.toolStripButton6.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.toolStripButton6, "toolStripButton6");
		this.toolStripButton6.Name = "toolStripButton6";
		this.toolStripSeparator5.Name = "toolStripSeparator5";
		resources.ApplyResources(this.toolStripSeparator5, "toolStripSeparator5");
		resources.ApplyResources(this.toolStripButton7, "toolStripButton7");
		this.toolStripButton7.Name = "toolStripButton7";
		resources.ApplyResources(this.excelPage_MonitorDelay_NumericUpDown, "excelPage_MonitorDelay_NumericUpDown");
		this.excelPage_MonitorDelay_NumericUpDown.Name = "excelPage_MonitorDelay_NumericUpDown";
		resources.ApplyResources(this.MonitorDelay_E2_Label, "MonitorDelay_E2_Label");
		this.MonitorDelay_E2_Label.Name = "MonitorDelay_E2_Label";
		resources.ApplyResources(this.MonitorDelay_B2_Label, "MonitorDelay_B2_Label");
		this.MonitorDelay_B2_Label.Name = "MonitorDelay_B2_Label";
		resources.ApplyResources(this.excelPage_startup_Button, "excelPage_startup_Button");
		this.excelPage_startup_Button.Name = "excelPage_startup_Button";
		this.excelPage_startup_Button.UseVisualStyleBackColor = true;
		this.excelPage_startup_Button.Click += new System.EventHandler(excelPage_startup_Button_Click);
		resources.ApplyResources(this.excelPage_systemtray_Button, "excelPage_systemtray_Button");
		this.excelPage_systemtray_Button.Name = "excelPage_systemtray_Button";
		this.excelPage_systemtray_Button.UseVisualStyleBackColor = true;
		this.excelPage_systemtray_Button.Click += new System.EventHandler(excelPage_systemtray_Button_Click);
		resources.ApplyResources(this.excelPage_autoclear_checkbox, "excelPage_autoclear_checkbox");
		this.excelPage_autoclear_checkbox.Name = "excelPage_autoclear_checkbox";
		this.excelPage_autoclear_checkbox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.excelPage_auto_checkbox, "excelPage_auto_checkbox");
		this.excelPage_auto_checkbox.Name = "excelPage_auto_checkbox";
		this.excelPage_auto_checkbox.UseVisualStyleBackColor = true;
		this.excelPage_auto_checkbox.CheckedChanged += new System.EventHandler(excelPage_auto_checkbox_CheckedChanged);
		resources.ApplyResources(this.excelbrowseButton, "excelbrowseButton");
		this.excelbrowseButton.Name = "excelbrowseButton";
		this.excelbrowseButton.UseVisualStyleBackColor = true;
		this.excelbrowseButton.Click += new System.EventHandler(excelbrowseButton_Click);
		resources.ApplyResources(this.excelfileTextBox, "excelfileTextBox");
		this.excelfileTextBox.Name = "excelfileTextBox";
		resources.ApplyResources(this.excelPage_clear_checkbox, "excelPage_clear_checkbox");
		this.excelPage_clear_checkbox.Name = "excelPage_clear_checkbox";
		this.excelPage_clear_checkbox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.excelPage_update_checkbox, "excelPage_update_checkbox");
		this.excelPage_update_checkbox.Name = "excelPage_update_checkbox";
		this.excelPage_update_checkbox.UseVisualStyleBackColor = true;
		this.excelPage_update_checkbox.CheckedChanged += new System.EventHandler(excelPage_update_checkbox_CheckedChanged);
		this.excelSelAllbutton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.excelSelAllbutton, "excelSelAllbutton");
		this.excelSelAllbutton.Name = "excelSelAllbutton";
		this.excelSelAllbutton.UseVisualStyleBackColor = true;
		this.excelSelAllbutton.Click += new System.EventHandler(txtSelAllbutton_Click);
		this.excelExebutton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.excelExebutton, "excelExebutton");
		this.excelExebutton.Name = "excelExebutton";
		this.excelExebutton.UseVisualStyleBackColor = true;
		this.excelExebutton.Click += new System.EventHandler(excelExebutton_Click);
		resources.ApplyResources(this.mdbTabPage, "mdbTabPage");
		this.mdbTabPage.Controls.Add(this.MDBsave_Button);
		this.mdbTabPage.Controls.Add(this.fileComboBox);
		this.mdbTabPage.Controls.Add(this.progressLabel);
		this.mdbTabPage.Controls.Add(this.progressBar);
		this.mdbTabPage.Controls.Add(this.cancelButton);
		this.mdbTabPage.Controls.Add(this.downloadButton);
		this.mdbTabPage.Controls.Add(this.uploadButton);
		this.mdbTabPage.Controls.Add(this.label1);
		this.mdbTabPage.Controls.Add(this.passowrdLabel);
		this.mdbTabPage.Controls.Add(this.usernameLabel);
		this.mdbTabPage.Controls.Add(this.uriTextBox);
		this.mdbTabPage.Controls.Add(this.passwordTextBox);
		this.mdbTabPage.Controls.Add(this.logCheckBox);
		this.mdbTabPage.Controls.Add(this.usernameTextBox);
		this.mdbTabPage.Name = "mdbTabPage";
		this.mdbTabPage.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.MDBsave_Button, "MDBsave_Button");
		this.MDBsave_Button.Name = "MDBsave_Button";
		this.MDBsave_Button.UseVisualStyleBackColor = true;
		this.MDBsave_Button.Click += new System.EventHandler(MDBsave_Button_Click);
		this.fileComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.fileComboBox.FormattingEnabled = true;
		this.fileComboBox.Items.AddRange(new object[2]
		{
			resources.GetString("fileComboBox.Items"),
			resources.GetString("fileComboBox.Items1")
		});
		resources.ApplyResources(this.fileComboBox, "fileComboBox");
		this.fileComboBox.Name = "fileComboBox";
		resources.ApplyResources(this.progressLabel, "progressLabel");
		this.progressLabel.Name = "progressLabel";
		resources.ApplyResources(this.progressBar, "progressBar");
		this.progressBar.Name = "progressBar";
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		this.cancelButton.Click += new System.EventHandler(cancelButton_Click);
		resources.ApplyResources(this.downloadButton, "downloadButton");
		this.downloadButton.Name = "downloadButton";
		this.downloadButton.UseVisualStyleBackColor = true;
		this.downloadButton.Click += new System.EventHandler(downloadButton_Click);
		resources.ApplyResources(this.uploadButton, "uploadButton");
		this.uploadButton.Name = "uploadButton";
		this.uploadButton.UseVisualStyleBackColor = true;
		this.uploadButton.Click += new System.EventHandler(uploadButton_Click);
		resources.ApplyResources(this.label1, "label1");
		this.label1.Name = "label1";
		resources.ApplyResources(this.passowrdLabel, "passowrdLabel");
		this.passowrdLabel.Name = "passowrdLabel";
		resources.ApplyResources(this.usernameLabel, "usernameLabel");
		this.usernameLabel.Name = "usernameLabel";
		resources.ApplyResources(this.uriTextBox, "uriTextBox");
		this.uriTextBox.Name = "uriTextBox";
		resources.ApplyResources(this.passwordTextBox, "passwordTextBox");
		this.passwordTextBox.Name = "passwordTextBox";
		resources.ApplyResources(this.logCheckBox, "logCheckBox");
		this.logCheckBox.Name = "logCheckBox";
		this.logCheckBox.UseVisualStyleBackColor = true;
		this.logCheckBox.CheckedChanged += new System.EventHandler(logCheckBox_CheckedChanged);
		resources.ApplyResources(this.usernameTextBox, "usernameTextBox");
		this.usernameTextBox.Name = "usernameTextBox";
		this.labelItemTableAdapter.ClearBeforeFill = true;
		this.stringTableAdapter.ClearBeforeFill = true;
		this.specTableAdapter.ClearBeforeFill = true;
		this.deptTableAdapter.ClearBeforeFill = true;
		this.classTableAdapter.ClearBeforeFill = true;
		this.unitTableAdapter.ClearBeforeFill = true;
		this.barcodeTableAdapter.ClearBeforeFill = true;
		this.salesmanTableAdapter.ClearBeforeFill = true;
		this.labelTableAdapter.ClearBeforeFill = true;
		this.faceTableAdapter.ClearBeforeFill = true;
		this.pLUTableAdapter.ClearBeforeFill = true;
		this.webClient.BaseAddress = "";
		this.webClient.CachePolicy = null;
		this.webClient.Credentials = null;
		this.webClient.Encoding = (System.Text.Encoding)resources.GetObject("webClient.Encoding");
		this.webClient.Headers = (System.Net.WebHeaderCollection)resources.GetObject("webClient.Headers");
		this.webClient.QueryString = (System.Collections.Specialized.NameValueCollection)resources.GetObject("webClient.QueryString");
		this.webClient.UseDefaultCredentials = false;
		this.webClient.DownloadFileCompleted += new System.ComponentModel.AsyncCompletedEventHandler(webClient_DownloadFileCompleted);
		this.webClient.UploadFileCompleted += new System.Net.UploadFileCompletedEventHandler(webClient_UploadFileCompleted);
		this.webClient.DownloadProgressChanged += new System.Net.DownloadProgressChangedEventHandler(webClient_DownloadProgressChanged);
		this.webClient.UploadProgressChanged += new System.Net.UploadProgressChangedEventHandler(webClient_UploadProgressChanged);
		this.custom1TableAdapter.ClearBeforeFill = true;
		this.custom2TableAdapter.ClearBeforeFill = true;
		this.custom3TableAdapter.ClearBeforeFill = true;
		this.custom4TableAdapter.ClearBeforeFill = true;
		this.excelDefaultTableAdapter.ClearBeforeFill = true;
		this.unitTableAdapter1.ClearBeforeFill = true;
		this.excelTableAdapter.ClearBeforeFill = true;
		this.vipTableAdapter.ClearBeforeFill = true;
		this.faceListTableAdapter.ClearBeforeFill = true;
		this.deviceTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this.BottomToolStripPanel, "BottomToolStripPanel");
		this.BottomToolStripPanel.Name = "BottomToolStripPanel";
		this.BottomToolStripPanel.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.BottomToolStripPanel.RowMargin = new System.Windows.Forms.Padding(3, 0, 0, 0);
		resources.ApplyResources(this.TopToolStripPanel, "TopToolStripPanel");
		this.TopToolStripPanel.Name = "TopToolStripPanel";
		this.TopToolStripPanel.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.TopToolStripPanel.RowMargin = new System.Windows.Forms.Padding(3, 0, 0, 0);
		resources.ApplyResources(this.RightToolStripPanel, "RightToolStripPanel");
		this.RightToolStripPanel.Name = "RightToolStripPanel";
		this.RightToolStripPanel.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.RightToolStripPanel.RowMargin = new System.Windows.Forms.Padding(3, 0, 0, 0);
		resources.ApplyResources(this.LeftToolStripPanel, "LeftToolStripPanel");
		this.LeftToolStripPanel.Name = "LeftToolStripPanel";
		this.LeftToolStripPanel.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.LeftToolStripPanel.RowMargin = new System.Windows.Forms.Padding(3, 0, 0, 0);
		resources.ApplyResources(this.ContentPanel, "ContentPanel");
		this.toolStrip.Items.AddRange(new System.Windows.Forms.ToolStripItem[14]
		{
			this.addToolStripButton, this.deleteToolStripButton, this.findToolStripButton, this.shutToolStripButton, this.toolStripSeparator3, this.taskToolStripButton, this.toolStripSeparator1, this.selAllToolStripButton, this.cancelToolStripButton, this.timeToolStripButton,
			this.renameToolStripButton, this.ipToolStripButton, this.MAC_ToolStripButton, this.MACr_ToolStripButton
		});
		resources.ApplyResources(this.toolStrip, "toolStrip");
		this.toolStrip.Name = "toolStrip";
		this.toolStrip.Stretch = true;
		resources.ApplyResources(this.addToolStripButton, "addToolStripButton");
		this.addToolStripButton.Name = "addToolStripButton";
		this.addToolStripButton.Click += new System.EventHandler(addToolStripButton_Click);
		resources.ApplyResources(this.deleteToolStripButton, "deleteToolStripButton");
		this.deleteToolStripButton.Name = "deleteToolStripButton";
		this.deleteToolStripButton.Click += new System.EventHandler(deleteToolStripButton_Click);
		this.findToolStripButton.Image = ECS.Properties.Resources.Search;
		resources.ApplyResources(this.findToolStripButton, "findToolStripButton");
		this.findToolStripButton.Name = "findToolStripButton";
		this.findToolStripButton.Click += new System.EventHandler(findToolStripButton_Click);
		this.shutToolStripButton.Image = ECS.Properties.Resources.Shut;
		resources.ApplyResources(this.shutToolStripButton, "shutToolStripButton");
		this.shutToolStripButton.Name = "shutToolStripButton";
		this.shutToolStripButton.Click += new System.EventHandler(shutToolStripButton_Click);
		this.toolStripSeparator3.Name = "toolStripSeparator3";
		resources.ApplyResources(this.toolStripSeparator3, "toolStripSeparator3");
		this.taskToolStripButton.Image = ECS.Properties.Resources.Schedule;
		resources.ApplyResources(this.taskToolStripButton, "taskToolStripButton");
		this.taskToolStripButton.Name = "taskToolStripButton";
		this.taskToolStripButton.Click += new System.EventHandler(taskToolStripButton_Click);
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		this.selAllToolStripButton.Image = ECS.Properties.Resources.Checkbox;
		resources.ApplyResources(this.selAllToolStripButton, "selAllToolStripButton");
		this.selAllToolStripButton.Name = "selAllToolStripButton";
		this.selAllToolStripButton.Click += new System.EventHandler(selAllToolStripButton_Click);
		this.cancelToolStripButton.Image = ECS.Properties.Resources.Undo;
		resources.ApplyResources(this.cancelToolStripButton, "cancelToolStripButton");
		this.cancelToolStripButton.Name = "cancelToolStripButton";
		this.cancelToolStripButton.Click += new System.EventHandler(cancelToolStripButton_Click);
		this.timeToolStripButton.Image = ECS.Properties.Resources.Time;
		resources.ApplyResources(this.timeToolStripButton, "timeToolStripButton");
		this.timeToolStripButton.Name = "timeToolStripButton";
		this.timeToolStripButton.Click += new System.EventHandler(timeToolStripButton_Click);
		resources.ApplyResources(this.renameToolStripButton, "renameToolStripButton");
		this.renameToolStripButton.Name = "renameToolStripButton";
		this.renameToolStripButton.Click += new System.EventHandler(renameToolStripButton_Click);
		resources.ApplyResources(this.ipToolStripButton, "ipToolStripButton");
		this.ipToolStripButton.Name = "ipToolStripButton";
		this.ipToolStripButton.Click += new System.EventHandler(ipToolStripButton_Click);
		this.MAC_ToolStripButton.Image = ECS.Properties.Resources.MAC;
		resources.ApplyResources(this.MAC_ToolStripButton, "MAC_ToolStripButton");
		this.MAC_ToolStripButton.Name = "MAC_ToolStripButton";
		this.MAC_ToolStripButton.Click += new System.EventHandler(MAC_ToolStripButton_Click);
		this.MACr_ToolStripButton.Image = ECS.Properties.Resources.MAC_Recover;
		resources.ApplyResources(this.MACr_ToolStripButton, "MACr_ToolStripButton");
		this.MACr_ToolStripButton.Name = "MACr_ToolStripButton";
		this.MACr_ToolStripButton.Click += new System.EventHandler(MACr_ToolStripButton_Click);
		this.expandshrink_ToolStrip.BackColor = System.Drawing.Color.FromArgb(255, 255, 128);
		this.expandshrink_ToolStrip.GripStyle = System.Windows.Forms.ToolStripGripStyle.Hidden;
		this.expandshrink_ToolStrip.Items.AddRange(new System.Windows.Forms.ToolStripItem[3] { this.ethernet_ToolStripLabel, this.expand_toolStripButton, this.shrink_ToolStripButton });
		resources.ApplyResources(this.expandshrink_ToolStrip, "expandshrink_ToolStrip");
		this.expandshrink_ToolStrip.Name = "expandshrink_ToolStrip";
		this.ethernet_ToolStripLabel.Name = "ethernet_ToolStripLabel";
		resources.ApplyResources(this.ethernet_ToolStripLabel, "ethernet_ToolStripLabel");
		this.expand_toolStripButton.Alignment = System.Windows.Forms.ToolStripItemAlignment.Right;
		this.expand_toolStripButton.Image = ECS.Properties.Resources.Expand;
		resources.ApplyResources(this.expand_toolStripButton, "expand_toolStripButton");
		this.expand_toolStripButton.Name = "expand_toolStripButton";
		this.expand_toolStripButton.Click += new System.EventHandler(expand_Button_Click);
		this.shrink_ToolStripButton.Alignment = System.Windows.Forms.ToolStripItemAlignment.Right;
		this.shrink_ToolStripButton.Image = ECS.Properties.Resources.Shrink;
		resources.ApplyResources(this.shrink_ToolStripButton, "shrink_ToolStripButton");
		this.shrink_ToolStripButton.Name = "shrink_ToolStripButton";
		this.shrink_ToolStripButton.Click += new System.EventHandler(shrink_ToolStripButton_Click);
		this.reportTimer.Interval = 60000;
		this.reportTimer.Tick += new System.EventHandler(reportTimer_Tick);
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer);
		base.Controls.Add(this.toolStrip);
		base.Controls.Add(this.expandshrink_ToolStrip);
		base.Name = "NetForm";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(NetForm_FormClosing);
		base.Load += new System.EventHandler(NetForm_Load);
		this.splitContainer.Panel1.ResumeLayout(false);
		this.splitContainer.Panel2.ResumeLayout(false);
		this.splitContainer.ResumeLayout(false);
		this.tabControl.ResumeLayout(false);
		this.ecsTabPage.ResumeLayout(false);
		this.ecsTabPage.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.faceListBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).EndInit();
		this.reportTabPage.ResumeLayout(false);
		this.reportTabPage.PerformLayout();
		this.Report2_GroupBox.ResumeLayout(false);
		this.Report2_GroupBox.PerformLayout();
		this.Report1_GroupBox.ResumeLayout(false);
		this.Report1_GroupBox.PerformLayout();
		this.txtPage.ResumeLayout(false);
		this.txtPage.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.txtPage_MonitorDelay_NumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.formypeBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		this.excelPage.ResumeLayout(false);
		this.splitContainer1.Panel1.ResumeLayout(false);
		this.splitContainer1.Panel2.ResumeLayout(false);
		this.splitContainer1.Panel2.PerformLayout();
		this.splitContainer1.ResumeLayout(false);
		this.splitContainer2.Panel1.ResumeLayout(false);
		this.splitContainer2.Panel1.PerformLayout();
		this.splitContainer2.Panel2.ResumeLayout(false);
		this.splitContainer2.Panel2.PerformLayout();
		this.splitContainer2.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.excelDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLU_ColBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.excelBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.bindingNavigator).EndInit();
		this.bindingNavigator.ResumeLayout(false);
		this.bindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.excelDefaultDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.plu_ColbindingSource1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.excelDefaultBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.bindingNavigator1).EndInit();
		this.bindingNavigator1.ResumeLayout(false);
		this.bindingNavigator1.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.excelPage_MonitorDelay_NumericUpDown).EndInit();
		this.mdbTabPage.ResumeLayout(false);
		this.mdbTabPage.PerformLayout();
		this.toolStrip.ResumeLayout(false);
		this.toolStrip.PerformLayout();
		this.expandshrink_ToolStrip.ResumeLayout(false);
		this.expandshrink_ToolStrip.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
