using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Printing;
using System.Globalization;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class FaceForm : Form
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

	private delegate void DataSet_RefreshCallback(string Type);

	private IContainer components;

	private PLUTableAdapter pluTableAdapter;

	private FaceTableAdapter faceTableAdapter;

	private ECSDataSet eCSDataSet;

	private BindingSource pLUBindingSource;

	private SplitContainer splitContainer;

	private ComboBox faceComboBox;

	private Label layoutLabel;

	private ComboBox layoutComboBox;

	private Button fontButton;

	private Label faceLabel;

	private MyPanel myPanel;

	private CheckBox idCheckBox;

	private Button clearButton;

	private Button autoButton;

	private UIDataSet uiDataSet;

	private BindingSource scPLUL_bindingSource;

	private BindingSource scPLUP_bindingSource;

	private Button P0_Ethernet_button;

	private Button P0_TMSFile_button;

	private FaceListTableAdapter faceListTableAdapter;

	private Label scaleID_Label;

	private ComboBox faceListComboBox;

	private BindingSource faceListBindingSource;

	private Button addButton;

	private Button delButton;

	private Button Print_Button;

	private Button Picture_Button;

	private ClassTableAdapter classTableAdapter;

	private Font _font;

	private Font _idFont;

	private float _dpiGx;

	private float _dpiBx;

	private float _dpiGy;

	private float _dpiBy;

	private Bitmap _bitmap;

	private string _layout;

	private string _page;

	private SimComboVD_No[] ctFuc;

	private bool DataSet_Changed;

	private string LastFilter = "";

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.FaceForm));
		this.splitContainer = new System.Windows.Forms.SplitContainer();
		this.myPanel = new ECS.MyPanel();
		this.Picture_Button = new System.Windows.Forms.Button();
		this.delButton = new System.Windows.Forms.Button();
		this.addButton = new System.Windows.Forms.Button();
		this.P0_Ethernet_button = new System.Windows.Forms.Button();
		this.autoButton = new System.Windows.Forms.Button();
		this.P0_TMSFile_button = new System.Windows.Forms.Button();
		this.clearButton = new System.Windows.Forms.Button();
		this.idCheckBox = new System.Windows.Forms.CheckBox();
		this.faceLabel = new System.Windows.Forms.Label();
		this.faceComboBox = new System.Windows.Forms.ComboBox();
		this.faceListBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.eCSDataSet = new ECS.ECSDataSet();
		this.scPLUP_bindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uiDataSet = new ECS.UIDataSet();
		this.scaleID_Label = new System.Windows.Forms.Label();
		this.layoutLabel = new System.Windows.Forms.Label();
		this.faceListComboBox = new System.Windows.Forms.ComboBox();
		this.layoutComboBox = new System.Windows.Forms.ComboBox();
		this.scPLUL_bindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.fontButton = new System.Windows.Forms.Button();
		this.Print_Button = new System.Windows.Forms.Button();
		this.pluTableAdapter = new ECS.ECSDataSetTableAdapters.PLUTableAdapter();
		this.faceTableAdapter = new ECS.ECSDataSetTableAdapters.FaceTableAdapter();
		this.pLUBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.faceListTableAdapter = new ECS.ECSDataSetTableAdapters.FaceListTableAdapter();
		this.classTableAdapter = new ECS.ECSDataSetTableAdapters.ClassTableAdapter();
		this.splitContainer.Panel1.SuspendLayout();
		this.splitContainer.Panel2.SuspendLayout();
		this.splitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.faceListBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.scPLUP_bindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.scPLUL_bindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingSource).BeginInit();
		base.SuspendLayout();
		this.splitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer, "splitContainer");
		this.splitContainer.FixedPanel = System.Windows.Forms.FixedPanel.Panel2;
		this.splitContainer.Name = "splitContainer";
		resources.ApplyResources(this.splitContainer.Panel1, "splitContainer.Panel1");
		this.splitContainer.Panel1.Controls.Add(this.myPanel);
		this.splitContainer.Panel2.Controls.Add(this.Picture_Button);
		this.splitContainer.Panel2.Controls.Add(this.delButton);
		this.splitContainer.Panel2.Controls.Add(this.addButton);
		this.splitContainer.Panel2.Controls.Add(this.P0_Ethernet_button);
		this.splitContainer.Panel2.Controls.Add(this.autoButton);
		this.splitContainer.Panel2.Controls.Add(this.P0_TMSFile_button);
		this.splitContainer.Panel2.Controls.Add(this.clearButton);
		this.splitContainer.Panel2.Controls.Add(this.idCheckBox);
		this.splitContainer.Panel2.Controls.Add(this.faceLabel);
		this.splitContainer.Panel2.Controls.Add(this.faceComboBox);
		this.splitContainer.Panel2.Controls.Add(this.scaleID_Label);
		this.splitContainer.Panel2.Controls.Add(this.layoutLabel);
		this.splitContainer.Panel2.Controls.Add(this.faceListComboBox);
		this.splitContainer.Panel2.Controls.Add(this.layoutComboBox);
		this.splitContainer.Panel2.Controls.Add(this.fontButton);
		this.splitContainer.Panel2.Controls.Add(this.Print_Button);
		resources.ApplyResources(this.splitContainer.Panel2, "splitContainer.Panel2");
		this.splitContainer.TabStop = false;
		resources.ApplyResources(this.myPanel, "myPanel");
		this.myPanel.Name = "myPanel";
		this.myPanel.Paint += new System.Windows.Forms.PaintEventHandler(myPanel_Paint);
		this.myPanel.MouseClick += new System.Windows.Forms.MouseEventHandler(pictureBox_MouseClick);
		this.myPanel.MouseMove += new System.Windows.Forms.MouseEventHandler(pictureBox_MouseMove);
		resources.ApplyResources(this.Picture_Button, "Picture_Button");
		this.Picture_Button.Name = "Picture_Button";
		this.Picture_Button.UseVisualStyleBackColor = true;
		this.Picture_Button.Click += new System.EventHandler(saveButton_Click);
		resources.ApplyResources(this.delButton, "delButton");
		this.delButton.Name = "delButton";
		this.delButton.UseVisualStyleBackColor = true;
		this.delButton.Click += new System.EventHandler(delButton_Click);
		resources.ApplyResources(this.addButton, "addButton");
		this.addButton.Name = "addButton";
		this.addButton.UseVisualStyleBackColor = true;
		this.addButton.Click += new System.EventHandler(addButton_Click);
		resources.ApplyResources(this.P0_Ethernet_button, "P0_Ethernet_button");
		this.P0_Ethernet_button.Name = "P0_Ethernet_button";
		this.P0_Ethernet_button.UseVisualStyleBackColor = true;
		this.P0_Ethernet_button.Click += new System.EventHandler(P0_Ethernet_button_Click);
		resources.ApplyResources(this.autoButton, "autoButton");
		this.autoButton.Name = "autoButton";
		this.autoButton.UseVisualStyleBackColor = true;
		this.autoButton.Click += new System.EventHandler(autoButton_Click);
		resources.ApplyResources(this.P0_TMSFile_button, "P0_TMSFile_button");
		this.P0_TMSFile_button.Name = "P0_TMSFile_button";
		this.P0_TMSFile_button.UseVisualStyleBackColor = true;
		this.P0_TMSFile_button.Click += new System.EventHandler(P0_TMSFile_button_Click);
		resources.ApplyResources(this.clearButton, "clearButton");
		this.clearButton.Name = "clearButton";
		this.clearButton.UseVisualStyleBackColor = true;
		this.clearButton.Click += new System.EventHandler(clearButton_Click);
		resources.ApplyResources(this.idCheckBox, "idCheckBox");
		this.idCheckBox.Name = "idCheckBox";
		this.idCheckBox.UseVisualStyleBackColor = true;
		this.idCheckBox.CheckedChanged += new System.EventHandler(idCheckBox_CheckedChanged);
		resources.ApplyResources(this.faceLabel, "faceLabel");
		this.faceLabel.Name = "faceLabel";
		this.faceComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.faceListBindingSource, "PageMode", true));
		this.faceComboBox.DataSource = this.scPLUP_bindingSource;
		this.faceComboBox.DisplayMember = "Display";
		this.faceComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.faceComboBox.DropDownWidth = 250;
		this.faceComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.faceComboBox, "faceComboBox");
		this.faceComboBox.Name = "faceComboBox";
		this.faceComboBox.ValueMember = "Page";
		this.faceListBindingSource.DataMember = "FaceList";
		this.faceListBindingSource.DataSource = this.eCSDataSet;
		this.faceListBindingSource.Filter = "";
		this.faceListBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(faceListBindingSource_BindingComplete);
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.scPLUP_bindingSource.DataMember = "ScPLU_Page";
		this.scPLUP_bindingSource.DataSource = this.uiDataSet;
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.scaleID_Label, "scaleID_Label");
		this.scaleID_Label.Name = "scaleID_Label";
		resources.ApplyResources(this.layoutLabel, "layoutLabel");
		this.layoutLabel.Name = "layoutLabel";
		this.faceListComboBox.DataSource = this.faceListBindingSource;
		this.faceListComboBox.DisplayMember = "ScaleID";
		this.faceListComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.faceListComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.faceListComboBox, "faceListComboBox");
		this.faceListComboBox.Name = "faceListComboBox";
		this.faceListComboBox.ValueMember = "ScaleID";
		this.layoutComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.faceListBindingSource, "Layout", true));
		this.layoutComboBox.DataSource = this.scPLUL_bindingSource;
		this.layoutComboBox.DisplayMember = "Display";
		this.layoutComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.layoutComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.layoutComboBox, "layoutComboBox");
		this.layoutComboBox.Name = "layoutComboBox";
		this.layoutComboBox.ValueMember = "Layout";
		this.scPLUL_bindingSource.DataMember = "ScPLU_Layout";
		this.scPLUL_bindingSource.DataSource = this.uiDataSet;
		this.scPLUL_bindingSource.Filter = "[Display] <> '#NULL#'";
		resources.ApplyResources(this.fontButton, "fontButton");
		this.fontButton.Name = "fontButton";
		this.fontButton.UseVisualStyleBackColor = true;
		this.fontButton.Click += new System.EventHandler(fontButton_Click);
		resources.ApplyResources(this.Print_Button, "Print_Button");
		this.Print_Button.Name = "Print_Button";
		this.Print_Button.UseVisualStyleBackColor = true;
		this.Print_Button.Click += new System.EventHandler(Print_Button_Click);
		this.pluTableAdapter.ClearBeforeFill = true;
		this.faceTableAdapter.ClearBeforeFill = true;
		this.pLUBindingSource.DataMember = "PLU";
		this.pLUBindingSource.DataSource = this.eCSDataSet;
		this.faceListTableAdapter.ClearBeforeFill = true;
		this.classTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer);
		base.Name = "FaceForm";
		base.ShowInTaskbar = false;
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(FaceForm_FormClosing);
		base.Load += new System.EventHandler(FaceForm_Load);
		base.Leave += new System.EventHandler(FaceForm_Leave);
		this.splitContainer.Panel1.ResumeLayout(false);
		this.splitContainer.Panel2.ResumeLayout(false);
		this.splitContainer.Panel2.PerformLayout();
		this.splitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.faceListBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.scPLUP_bindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.scPLUL_bindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLUBindingSource).EndInit();
		base.ResumeLayout(false);
	}

	public FaceForm()
	{
		InitializeComponent();
	}

	private Bitmap DrawFace_bmp()
	{
		Bitmap bitmap = new Bitmap(_bitmap);
		bitmap.SetResolution(_bitmap.HorizontalResolution, _bitmap.VerticalResolution);
		using Graphics graphics = Graphics.FromImage(bitmap);
		StringFormat stringFormat = new StringFormat();
		stringFormat.Alignment = StringAlignment.Center;
		stringFormat.LineAlignment = StringAlignment.Center;
		StringFormat stringFormat2 = new StringFormat();
		stringFormat2.Alignment = StringAlignment.Far;
		stringFormat2.LineAlignment = StringAlignment.Far;
		foreach (UIDataSet.ScPLU_SectionRow item in uiDataSet.ScPLU_Section)
		{
			if (!(item.Page == _page))
			{
				continue;
			}
			for (int i = 0; i < item.Num_Y; i++)
			{
				for (int j = 0; j < item.Num_X; j++)
				{
					int facePLUa = GetFacePLUa(item.Data_Page, item.Data_Offset + j + i * item.Num_X);
					if (facePLUa != 0)
					{
						string pLUName = GetPLUName(facePLUa);
						graphics.DrawString(pLUName, _font, Brushes.Black, new RectangleF(item.Start_X + j * item.Offset_X, item.Start_Y + i * item.Offset_Y, item.Rect_X, item.Rect_Y), stringFormat);
						if (idCheckBox.Checked && facePLUa > 0)
						{
							graphics.DrawString(facePLUa.ToString(), _idFont, Brushes.Black, new RectangleF(item.Start_X + j * item.Offset_X, item.Start_Y + i * item.Offset_Y + item.Rect_Y / 2, item.Rect_X, item.Rect_Y / 2), stringFormat2);
						}
					}
				}
			}
		}
		return bitmap;
	}

	private void FaceList_FaceListRowChanged(object sender, ECSDataSet.FaceListRowChangeEvent e)
	{
		if (e.Action == DataRowAction.Rollback || e.Action == DataRowAction.Commit)
		{
			return;
		}
		try
		{
			faceListTableAdapter.Update(eCSDataSet.FaceList);
			DataSet_Changed = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void Face_FaceRowChanged(object sender, ECSDataSet.FaceRowChangeEvent e)
	{
		if (e.Action == DataRowAction.Rollback || e.Action == DataRowAction.Commit)
		{
			return;
		}
		try
		{
			faceTableAdapter.Update(eCSDataSet.Face);
			DataSet_Changed = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
			return;
		}
		if (Type == "Face")
		{
			eCSDataSet.Dept.Clear();
			faceTableAdapter.Fill(eCSDataSet.Face);
			myPanel.Invalidate();
		}
		if (Type == "PLU")
		{
			eCSDataSet.PLU.Clear();
			pluTableAdapter.Fill(eCSDataSet.PLU);
			myPanel.Invalidate();
		}
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "FaceForm");
	}

	private void FaceForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_Shortcutkey");
		addButton.Text = Program.GetLang("pw_AddNew");
		autoButton.Text = Program.GetLang("pw_AutoAllocation");
		clearButton.Text = Program.GetLang("pw_ClearAll");
		delButton.Text = Program.GetLang("pw_Delete");
		faceLabel.Text = Program.GetLang("pw_Page");
		fontButton.Text = Program.GetLang("pw_Font");
		idCheckBox.Text = Program.GetLang("pw_PLUNo");
		layoutLabel.Text = Program.GetLang("pw_Layout");
		P0_Ethernet_button.Text = Program.GetLang("pw_Ethernet");
		P0_TMSFile_button.Text = Program.GetLang("pw_TMSFile");
		Picture_Button.Text = Program.GetLang("pw_Picture");
		scaleID_Label.Text = Program.GetLang("pw_ID");
		Print_Button.Text = Program.GetLang("pw_Print");
		Font = Settings.Default.CustomFont;
		faceListTableAdapter.Fill(eCSDataSet.FaceList);
		faceTableAdapter.Fill(eCSDataSet.Face);
		pluTableAdapter.Fill(eCSDataSet.PLU);
		delButton.Enabled = eCSDataSet.FaceList.Count > 1;
		_font = Settings.Default.faceFont;
		_idFont = new Font(Font.FontFamily, 9f);
		string fileName = Application.StartupPath + "\\Combo.xml";
		uiDataSet.ReadXml(fileName);
		int num = uiDataSet.ScPLU_Layout.Rows.Count;
		while (num > 0)
		{
			num--;
			if (uiDataSet.ScPLU_Layout.Rows[num].ItemArray[1] as string == "")
			{
				uiDataSet.ScPLU_Layout.Rows[num].Delete();
			}
		}
		uiDataSet.ScPLU_Layout.AcceptChanges();
		string[] array = uiDataSet.SimCombo.FindByName("Shortcut Fuction").ValueDisplay.Split('|');
		ctFuc = new SimComboVD_No[array.Length / 2];
		for (int i = 0; i < array.Length / 2; i++)
		{
			SimComboVD_No simComboVD_No = new SimComboVD_No();
			simComboVD_No.Value = int.Parse(array[i * 2]);
			if (simComboVD_No.Value == 63)
			{
				simComboVD_No.Display = string.Format(array[i * 2 + 1], Program.GetLang_Plus("pw_Payment1"));
			}
			else if (simComboVD_No.Value == 64)
			{
				simComboVD_No.Display = string.Format(array[i * 2 + 1], Program.GetLang_Plus("pw_Payment2"));
			}
			else if (simComboVD_No.Value == 65)
			{
				simComboVD_No.Display = string.Format(array[i * 2 + 1], Program.GetLang_Plus("pw_Payment3"));
			}
			else
			{
				simComboVD_No.Display = array[i * 2 + 1];
			}
			ctFuc[i] = simComboVD_No;
		}
		try
		{
			ECSDataSet.FaceListRow faceListRow = eCSDataSet.FaceList.FindByScaleID((string)faceListComboBox.SelectedValue);
			if (faceListRow != null)
			{
				layoutComboBox.SelectedValue = faceListRow.Layout;
				faceComboBox.SelectedValue = faceListRow.PageMode;
			}
			int num2 = faceListBindingSource.Find("ScaleID", Settings.Default.ScFile_ScaleID);
			if (num2 != -1)
			{
				faceListComboBox.SelectedIndex = num2;
			}
			if (faceListComboBox.SelectedIndex == -1)
			{
				faceListComboBox.SelectedIndex = 0;
			}
			faceListRow = eCSDataSet.FaceList.FindByScaleID((string)faceListComboBox.SelectedValue);
			layoutComboBox.SelectedValue = faceListRow.Layout;
			if (layoutComboBox.SelectedIndex == -1)
			{
				layoutComboBox.SelectedValue = Settings.Default.defaultSCP;
			}
			if (layoutComboBox.SelectedIndex == -1)
			{
				layoutComboBox.SelectedIndex = 0;
			}
			faceComboBox.SelectedValue = faceListRow.PageMode;
			if (faceComboBox.SelectedIndex == -1)
			{
				faceComboBox.SelectedValue = Settings.Default.defaultSCP_Page;
			}
		}
		catch (Exception)
		{
		}
		faceComboBox.SelectedIndexChanged += faceComboBox_SelectedIndexChanged;
		layoutComboBox.SelectedIndexChanged += layoutComboBox_SelectedIndexChanged;
		faceListComboBox.SelectedIndexChanged += faceListComboBox_SelectedIndexChanged;
		eCSDataSet.FaceList.FaceListRowChanged += FaceList_FaceListRowChanged;
		ChangeFace();
	}

	private void ChangeFace()
	{
		if (layoutComboBox.SelectedValue == null || faceComboBox.SelectedValue == null)
		{
			return;
		}
		_layout = layoutComboBox.SelectedValue.ToString();
		_page = faceComboBox.SelectedValue.ToString();
		string fileName = Application.StartupPath + "\\ScPLU\\" + _layout + ".xml";
		uiDataSet.ScPLU_PageInfo.Clear();
		uiDataSet.ScPLU_Section.Clear();
		uiDataSet.ScPLU_PageInfo.ReadXml(fileName);
		uiDataSet.ScPLU_Section.ReadXml(fileName);
		UIDataSet.ScPLU_PageInfoRow scPLU_PageInfoRow = (UIDataSet.ScPLU_PageInfoRow)uiDataSet.ScPLU_PageInfo.Rows.Find(new object[1] { _page });
		if (scPLU_PageInfoRow != null)
		{
			_bitmap = new Bitmap(Application.StartupPath + "\\ScPLU\\" + scPLU_PageInfoRow.Bitmap);
			using (Graphics graphics = CreateGraphics())
			{
				_dpiGx = graphics.DpiX;
				_dpiGy = graphics.DpiY;
			}
			_dpiBx = _bitmap.HorizontalResolution;
			_dpiBy = _bitmap.VerticalResolution;
			myPanel.Width = (int)((float)_bitmap.Width * _dpiGx / _dpiBx + 5f);
			myPanel.Height = (int)((float)_bitmap.Height * _dpiGy / _dpiBy + 5f);
			myPanel.Invalidate();
		}
	}

	private void faceComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		if (faceComboBox.SelectedIndex == -1)
		{
			faceComboBox.SelectedValue = Settings.Default.defaultSCP_Page;
			if (faceComboBox.SelectedIndex == -1)
			{
				faceComboBox.SelectedIndex = 0;
			}
		}
		ChangeFace();
	}

	private void layoutComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		if (layoutComboBox.SelectedIndex == -1)
		{
			layoutComboBox.SelectedValue = Settings.Default.defaultSCP;
			if (layoutComboBox.SelectedIndex == -1)
			{
				layoutComboBox.SelectedIndex = 0;
			}
		}
		ChangeFace();
	}

	private void faceListComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		faceListBindingSource.Find("ScaleID", (string)faceListComboBox.SelectedValue);
		Settings.Default.ScFile_ScaleID = (string)faceListComboBox.SelectedValue;
		Settings.Default.Save();
		ChangeFace();
		DataSet_Changed = true;
	}

	private static ImageCodecInfo GetEncoderInfo(string mimeType)
	{
		ImageCodecInfo[] imageEncoders = ImageCodecInfo.GetImageEncoders();
		for (int i = 0; i < imageEncoders.Length; i++)
		{
			if (imageEncoders[i].MimeType == mimeType)
			{
				return imageEncoders[i];
			}
		}
		return null;
	}

	private static void SaveJPGWithCompressionSetting(Image image, string szFileName, long lCompression)
	{
		EncoderParameters encoderParameters = new EncoderParameters(1);
		encoderParameters.Param[0] = new EncoderParameter(Encoder.Quality, lCompression);
		ImageCodecInfo encoderInfo = GetEncoderInfo("image/jpeg");
		image.Save(szFileName, encoderInfo, encoderParameters);
	}

	private void saveButton_Click(object sender, EventArgs e)
	{
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.Filter = Program.GetLang("pw_JPEGFile___jpg____jpg_AllFile_________");
		saveFileDialog.AddExtension = true;
		if (saveFileDialog.ShowDialog(this) == DialogResult.OK)
		{
			Bitmap image = DrawFace_bmp();
			SaveJPGWithCompressionSetting(image, saveFileDialog.FileName, 100L);
		}
	}

	private void fontButton_Click(object sender, EventArgs e)
	{
		FontDialog fontDialog = new FontDialog();
		fontDialog.Font = _font;
		if (fontDialog.ShowDialog(this) == DialogResult.OK)
		{
			_font = fontDialog.Font;
			Settings.Default.faceFont = _font;
			myPanel.Invalidate();
		}
	}

	private string GetPLUName(int PLUID)
	{
		if (PLUID >= 0)
		{
			ECSDataSet.PLURow pLURow = eCSDataSet.PLU.FindByPLUID(PLUID);
			if (pLURow == null)
			{
				return string.Empty;
			}
			return pLURow.Name;
		}
		for (int i = 0; i < ctFuc.Length; i++)
		{
			if (ctFuc[i].Value == -PLUID)
			{
				return ctFuc[i].Display;
			}
		}
		return string.Empty;
	}

	private int GetFacePLUa(int page, int offset)
	{
		return eCSDataSet.Face.FindByScaleIDKeyIDPageID((string)faceListComboBox.SelectedValue, offset, page)?.PLUID ?? 0;
	}

	private void UpdateFacePLUa(int page, int offset, int PLUID)
	{
		ECSDataSet.FaceRow faceRow = eCSDataSet.Face.FindByScaleIDKeyIDPageID((string)faceListComboBox.SelectedValue, offset, page);
		if (faceRow != null)
		{
			faceRow.PLUID = PLUID;
			return;
		}
		ECSDataSet.FaceListRow parentFaceListRowByKF_FaceList_Face = eCSDataSet.FaceList.FindByScaleID((string)faceListComboBox.SelectedValue);
		eCSDataSet.Face.AddFaceRow(parentFaceListRowByKF_FaceList_Face, offset, page, PLUID);
	}

	private void ClearFacePLUa(int page, int offset)
	{
		eCSDataSet.Face.FindByScaleIDKeyIDPageID((string)faceListComboBox.SelectedValue, offset, page)?.Delete();
	}

	public void SaveData()
	{
		if (eCSDataSet.HasChanges())
		{
			try
			{
				faceListTableAdapter.Update(eCSDataSet.FaceList);
				faceTableAdapter.Update(eCSDataSet.Face);
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void FaceForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		eCSDataSet.FaceList.FaceListRowChanged -= FaceList_FaceListRowChanged;
		faceComboBox.SelectedIndexChanged -= faceComboBox_SelectedIndexChanged;
		layoutComboBox.SelectedIndexChanged -= layoutComboBox_SelectedIndexChanged;
		faceListComboBox.SelectedIndexChanged -= faceListComboBox_SelectedIndexChanged;
		SaveData();
	}

	private void pictureBox_MouseClick(object sender, MouseEventArgs e)
	{
		Point pt = new Point((int)((float)e.X * _dpiBx / _dpiGx), (int)((float)e.Y * _dpiBy / _dpiGy));
		foreach (UIDataSet.ScPLU_SectionRow item in uiDataSet.ScPLU_Section)
		{
			if (!(item.Page == _page))
			{
				continue;
			}
			for (int i = 0; i < item.Num_Y; i++)
			{
				for (int j = 0; j < item.Num_X; j++)
				{
					if (!new Rectangle(item.Start_X + j * item.Offset_X, item.Start_Y + i * item.Offset_Y, item.Rect_X, item.Rect_Y).Contains(pt))
					{
						continue;
					}
					int facePLUa = GetFacePLUa(item.Data_Page, item.Data_Offset + j + i * item.Num_X);
					using (SelForm selForm = new SelForm())
					{
						selForm.PLU = facePLUa;
						selForm.SG_Filter = LastFilter;
						switch (selForm.ShowDialog(this))
						{
						case DialogResult.OK:
							UpdateFacePLUa(item.Data_Page, item.Data_Offset + j + i * item.Num_X, selForm.PLU);
							break;
						case DialogResult.Ignore:
							UpdateFacePLUa(item.Data_Page, item.Data_Offset + j + i * item.Num_X, 0);
							break;
						}
						pluTableAdapter.Fill(eCSDataSet.PLU);
						LastFilter = selForm.SG_Filter;
					}
					myPanel.Invalidate();
					return;
				}
			}
		}
	}

	private void pictureBox_MouseMove(object sender, MouseEventArgs e)
	{
		Point pt = new Point((int)((float)e.X * _dpiBx / _dpiGx), (int)((float)e.Y * _dpiBy / _dpiGy));
		foreach (UIDataSet.ScPLU_SectionRow item in uiDataSet.ScPLU_Section)
		{
			if (!(item.Page == _page))
			{
				continue;
			}
			for (int i = 0; i < item.Num_Y; i++)
			{
				for (int j = 0; j < item.Num_X; j++)
				{
					if (new Rectangle(item.Start_X + j * item.Offset_X, item.Start_Y + i * item.Offset_Y, item.Rect_X, item.Rect_Y).Contains(pt))
					{
						myPanel.Cursor = Cursors.Hand;
						return;
					}
				}
			}
		}
		myPanel.Cursor = Cursors.Arrow;
	}

	private void myPanel_Paint(object sender, PaintEventArgs e)
	{
		Graphics graphics = e.Graphics;
		Bitmap image = DrawFace_bmp();
		graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
		graphics.DrawImage(image, new Point(0, 0));
	}

	private void idCheckBox_CheckedChanged(object sender, EventArgs e)
	{
		myPanel.Invalidate();
	}

	private void clearButton_Click(object sender, EventArgs e)
	{
		foreach (ECSDataSet.FaceRow item in eCSDataSet.Face)
		{
			if (item.ScaleID == (string)faceListComboBox.SelectedValue)
			{
				item.PLUID = 0;
			}
		}
		faceTableAdapter.Update(eCSDataSet.Face);
		DataSet_Changed = true;
		myPanel.Invalidate();
	}

	private void autoButton_Click(object sender, EventArgs e)
	{
		clearButton_Click(null, null);
		int num = 0;
		int num2 = 0;
		int num3 = 0;
		bool flag = false;
		if (eCSDataSet.FaceList.Count >= 2)
		{
			using FaceAutoFilterForm faceAutoFilterForm = new FaceAutoFilterForm();
			DialogResult dialogResult = faceAutoFilterForm.ShowDialog(this);
			if (dialogResult == DialogResult.OK)
			{
				num = faceAutoFilterForm.GetSort;
				num2 = faceAutoFilterForm.GetP1;
				num3 = faceAutoFilterForm.GetP2;
				flag = faceAutoFilterForm.GetP3;
			}
		}
		if (flag)
		{
			foreach (ECSDataSet.FaceRow item in eCSDataSet.Face)
			{
				if (item.ScaleID == (string)faceListComboBox.SelectedValue)
				{
					item.PLUID = 0;
				}
			}
		}
		pluTableAdapter.Fill(eCSDataSet.PLU);
		int num4 = 0;
		foreach (UIDataSet.ScPLU_SectionRow item2 in uiDataSet.ScPLU_Section)
		{
			if (item2.Page == _page)
			{
				num4 += item2.Num_X * item2.Num_Y;
			}
		}
		int[] array = new int[num4];
		int[] array2 = new int[num4];
		num4 = 0;
		int i;
		foreach (UIDataSet.ScPLU_SectionRow item3 in uiDataSet.ScPLU_Section)
		{
			if (item3.Page == _page)
			{
				int num5 = num4;
				i = num4;
				for (num4 += item3.Num_X * item3.Num_Y; i < num4; i++)
				{
					array[i] = item3.Data_Page;
					array2[i] = item3.Data_Offset + i - num5;
				}
			}
		}
		if (num == 4)
		{
			classTableAdapter.Fill(eCSDataSet.Class);
		}
		i = 0;
		foreach (ECSDataSet.PLURow item4 in eCSDataSet.PLU)
		{
			if (i >= num4)
			{
				break;
			}
			switch (num)
			{
			case 1:
				if (item4.PLUID > num3 || item4.PLUID < num2)
				{
					continue;
				}
				break;
			case 2:
				if (item4.Remark > num3 || item4.Remark < num2)
				{
					continue;
				}
				break;
			case 3:
				if (item4.ClassID != num2)
				{
					continue;
				}
				break;
			case 4:
			{
				ECSDataSet.ClassRow classRow = eCSDataSet.Class.FindByClassID(item4.ClassID);
				if (classRow == null || classRow.DeptID != num2)
				{
					continue;
				}
				break;
			}
			}
			ECSDataSet.FaceRow faceRow2 = eCSDataSet.Face.FindByScaleIDKeyIDPageID((string)faceListComboBox.SelectedValue, array2[i], array[i]);
			if (faceRow2 != null)
			{
				faceRow2.PLUID = item4.PLUID;
			}
			else
			{
				ECSDataSet.FaceListRow parentFaceListRowByKF_FaceList_Face = eCSDataSet.FaceList.FindByScaleID((string)faceListComboBox.SelectedValue);
				eCSDataSet.Face.AddFaceRow(parentFaceListRowByKF_FaceList_Face, array2[i], array[i], item4.PLUID);
			}
			i++;
		}
		faceTableAdapter.Update(eCSDataSet.Face);
		DataSet_Changed = true;
		myPanel.Invalidate();
	}

	private void P0_Ethernet_button_Click(object sender, EventArgs e)
	{
		Program.mf.PopMdiChild_Ethernet_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: true, Face: true, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
		if (Program.mf.m_netForm.mf_Docked)
		{
			base.WindowState = FormWindowState.Normal;
			Close();
		}
	}

	private void P0_TMSFile_button_Click(object sender, EventArgs e)
	{
		Program.mf.ShowDialog_TMSfile_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: true, Face: true, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
	}

	private void addButton_Click(object sender, EventArgs e)
	{
		string empty = string.Empty;
		using (InputForm inputForm = new InputForm())
		{
			if (inputForm.ShowDialog(this) != DialogResult.OK || inputForm.inputTextBox.Text.Length == 0)
			{
				return;
			}
			empty = inputForm.inputTextBox.Text;
		}
		if (MessageBox.Show(this, string.Format(Program.GetLang("pw_Add_0__"), empty), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
		{
			try
			{
				Program.Public_Cal_NewSCP(ref eCSDataSet, empty);
				SaveData();
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
			faceListComboBox.SelectedValue = empty;
			SaveData();
			DataSet_Changed = true;
			faceListComboBox_SelectedIndexChanged(null, null);
		}
		delButton.Enabled = eCSDataSet.FaceList.Count > 1;
	}

	private void delButton_Click(object sender, EventArgs e)
	{
		if (faceListComboBox.SelectedIndex == -1)
		{
			return;
		}
		string arg = (string)faceListComboBox.SelectedValue;
		if (eCSDataSet.FaceList.Count > 1 && MessageBox.Show(this, string.Format(Program.GetLang("pw_Delete_0__"), arg), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
		{
			try
			{
				ECSDataSet.FaceListRow faceListRow = eCSDataSet.FaceList.FindByScaleID((string)faceListComboBox.SelectedValue);
				faceListRow.Delete();
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
			SaveData();
			DataSet_Changed = true;
			faceListComboBox_SelectedIndexChanged(null, null);
		}
		delButton.Enabled = eCSDataSet.FaceList.Count > 1;
	}

	private void faceListBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
	{
		if (e.BindingCompleteContext == BindingCompleteContext.DataSourceUpdate)
		{
			BindingSource bindingSource = sender as BindingSource;
			try
			{
				bindingSource.EndEdit();
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				bindingSource.CancelEdit();
			}
		}
	}

	private void FaceForm_Leave(object sender, EventArgs e)
	{
		if (DataSet_Changed)
		{
			DataSet_Update("Face");
			DataSet_Changed = false;
		}
	}

	private void printDocument_PrintPage(object sender, PrintPageEventArgs e)
	{
		Bitmap bitmap = DrawFace_bmp();
		PrintDocument printDocument = sender as PrintDocument;
		e.Graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
		if (printDocument.DefaultPageSettings.PaperSize.Width > printDocument.DefaultPageSettings.PaperSize.Height != bitmap.Width > bitmap.Height)
		{
			bitmap.RotateFlip(RotateFlipType.Rotate90FlipNone);
		}
		int num = (int)((float)e.PageSettings.PaperSize.Width - (float)(bitmap.Width * 100) / bitmap.HorizontalResolution) / 2;
		int num2 = (int)((float)e.PageSettings.PaperSize.Height - (float)(bitmap.Height * 100) / bitmap.VerticalResolution) / 2;
		if (num < 0)
		{
			num = 0;
		}
		if (num2 < 0)
		{
			num2 = 0;
		}
		e.Graphics.DrawImage(bitmap, new Point(num, num2));
	}

	private void Print_Button_Click(object sender, EventArgs e)
	{
		using PrintDocument printDocument = new PrintDocument();
		printDocument.PrintPage += printDocument_PrintPage;
		PrintDialog printDialog = new PrintDialog();
		printDialog.Document = printDocument;
		if (printDialog.ShowDialog() == DialogResult.OK)
		{
			try
			{
				printDocument.Print();
				return;
			}
			catch (Exception ex)
			{
				MessageBox.Show(ex.Message, Program.GetLang("pw_Error_OperationFailed"), MessageBoxButtons.OK, MessageBoxIcon.Hand);
				printDocument.PrintController.OnEndPrint(printDocument, new PrintEventArgs());
				return;
			}
		}
	}
}
