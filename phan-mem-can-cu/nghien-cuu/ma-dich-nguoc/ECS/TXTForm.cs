using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class TXTForm : Form
{
	private IContainer components;

	private Button browseButton;

	private TextBox filenameTextBox;

	private TextBox typeTextBox;

	private Button cancelButton;

	private RadioButton saveButton;

	private RadioButton openButton;

	private Button exeButton;

	private Label txtfile;

	private ComboBox formtypeComboBox;

	private Label formtype;

	private BindingSource formypeBindingSource;

	private UIDataSet uiDataSet;

	private ECSDataSet eCSDataSet;

	private PLUTableAdapter pLUTableAdapter;

	private ECSDataSet ecsOldSet;

	private CheckBox txtPage_clear_checkbox;

	private Button Custom_Button;

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.TXTForm));
		this.browseButton = new System.Windows.Forms.Button();
		this.filenameTextBox = new System.Windows.Forms.TextBox();
		this.typeTextBox = new System.Windows.Forms.TextBox();
		this.cancelButton = new System.Windows.Forms.Button();
		this.saveButton = new System.Windows.Forms.RadioButton();
		this.openButton = new System.Windows.Forms.RadioButton();
		this.exeButton = new System.Windows.Forms.Button();
		this.txtfile = new System.Windows.Forms.Label();
		this.formtypeComboBox = new System.Windows.Forms.ComboBox();
		this.formypeBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uiDataSet = new ECS.UIDataSet();
		this.formtype = new System.Windows.Forms.Label();
		this.eCSDataSet = new ECS.ECSDataSet();
		this.pLUTableAdapter = new ECS.ECSDataSetTableAdapters.PLUTableAdapter();
		this.ecsOldSet = new ECS.ECSDataSet();
		this.txtPage_clear_checkbox = new System.Windows.Forms.CheckBox();
		this.Custom_Button = new System.Windows.Forms.Button();
		((System.ComponentModel.ISupportInitialize)this.formypeBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ecsOldSet).BeginInit();
		base.SuspendLayout();
		resources.ApplyResources(this.browseButton, "browseButton");
		this.browseButton.Name = "browseButton";
		this.browseButton.UseVisualStyleBackColor = true;
		this.browseButton.Click += new System.EventHandler(browseButton_Click);
		resources.ApplyResources(this.filenameTextBox, "filenameTextBox");
		this.filenameTextBox.Name = "filenameTextBox";
		this.filenameTextBox.TextChanged += new System.EventHandler(filenameTextBox_TextChanged);
		this.typeTextBox.AcceptsReturn = true;
		this.typeTextBox.AcceptsTab = true;
		resources.ApplyResources(this.typeTextBox, "typeTextBox");
		this.typeTextBox.Name = "typeTextBox";
		this.typeTextBox.TextChanged += new System.EventHandler(typeTextBox_TextChanged);
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.saveButton, "saveButton");
		this.saveButton.Name = "saveButton";
		this.saveButton.UseVisualStyleBackColor = true;
		this.saveButton.CheckedChanged += new System.EventHandler(saveButton_CheckedChanged);
		resources.ApplyResources(this.openButton, "openButton");
		this.openButton.Checked = true;
		this.openButton.Name = "openButton";
		this.openButton.TabStop = true;
		this.openButton.UseVisualStyleBackColor = true;
		this.openButton.CheckedChanged += new System.EventHandler(saveButton_CheckedChanged);
		this.exeButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		resources.ApplyResources(this.exeButton, "exeButton");
		this.exeButton.Name = "exeButton";
		this.exeButton.UseVisualStyleBackColor = true;
		this.exeButton.Click += new System.EventHandler(exeButton_Click);
		resources.ApplyResources(this.txtfile, "txtfile");
		this.txtfile.Name = "txtfile";
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
		resources.ApplyResources(this.formtype, "formtype");
		this.formtype.Name = "formtype";
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.pLUTableAdapter.ClearBeforeFill = true;
		this.ecsOldSet.DataSetName = "ECSDataSet";
		this.ecsOldSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.txtPage_clear_checkbox, "txtPage_clear_checkbox");
		this.txtPage_clear_checkbox.Name = "txtPage_clear_checkbox";
		this.txtPage_clear_checkbox.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Custom_Button, "Custom_Button");
		this.Custom_Button.Name = "Custom_Button";
		this.Custom_Button.UseVisualStyleBackColor = true;
		this.Custom_Button.Click += new System.EventHandler(Custom_Button_Click);
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.CancelButton = this.cancelButton;
		base.Controls.Add(this.txtPage_clear_checkbox);
		base.Controls.Add(this.formtype);
		base.Controls.Add(this.formtypeComboBox);
		base.Controls.Add(this.typeTextBox);
		base.Controls.Add(this.txtfile);
		base.Controls.Add(this.cancelButton);
		base.Controls.Add(this.saveButton);
		base.Controls.Add(this.browseButton);
		base.Controls.Add(this.openButton);
		base.Controls.Add(this.filenameTextBox);
		base.Controls.Add(this.Custom_Button);
		base.Controls.Add(this.exeButton);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "TXTForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(TXTForm_Load);
		((System.ComponentModel.ISupportInitialize)this.formypeBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ecsOldSet).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public TXTForm()
	{
		InitializeComponent();
	}

	private void browseButton_Click(object sender, EventArgs e)
	{
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.OverwritePrompt = false;
		saveFileDialog.CheckFileExists = false;
		saveFileDialog.FileName = filenameTextBox.Text;
		if (saveFileDialog.ShowDialog(this) == DialogResult.OK)
		{
			filenameTextBox.Text = saveFileDialog.FileName;
		}
	}

	private void exeButtonCheck()
	{
		if (typeTextBox.Text.Length == 0)
		{
			exeButton.Enabled = false;
		}
		else if (filenameTextBox.Text.Length == 0)
		{
			exeButton.Enabled = false;
		}
		else
		{
			exeButton.Enabled = saveButton.Checked || openButton.Checked;
		}
	}

	private void filenameTextBox_TextChanged(object sender, EventArgs e)
	{
		exeButtonCheck();
	}

	private void formtypeComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		if (formtypeComboBox.SelectedValue != null)
		{
			typeTextBox.Text = formtypeComboBox.SelectedValue.ToString();
		}
		typeTextBox.ReadOnly = formtypeComboBox.SelectedIndex > 0;
		Custom_Button.Enabled = formtypeComboBox.SelectedIndex == 0;
	}

	private void typeTextBox_TextChanged(object sender, EventArgs e)
	{
		exeButtonCheck();
	}

	private void saveButton_CheckedChanged(object sender, EventArgs e)
	{
		exeButtonCheck();
	}

	private void SaveToFile()
	{
		string text = filenameTextBox.Text;
		if (string.IsNullOrEmpty(text))
		{
			return;
		}
		string text2 = typeTextBox.Text;
		if (!string.IsNullOrEmpty(text2))
		{
			eCSDataSet.Clear();
			pLUTableAdapter.Fill(eCSDataSet.PLU);
			Exception ex = Common.ArithmeticFile_Write(ref eCSDataSet, text, text2);
			if (ex == null)
			{
				MessageBox.Show(this, Program.GetLang("pw_OperationSuccess"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
				base.DialogResult = DialogResult.OK;
			}
			else
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "SaveForm");
	}

	private void OpenFromFile()
	{
		string text = filenameTextBox.Text;
		if (string.IsNullOrEmpty(text))
		{
			return;
		}
		string text2 = typeTextBox.Text;
		if (string.IsNullOrEmpty(text2))
		{
			return;
		}
		ecsOldSet.Clear();
		Exception ex = Common.ArithmeticFile_Read(ref eCSDataSet, text, text2);
		if (ex == null)
		{
			if (eCSDataSet.PLU.Rows.Count != 0)
			{
				if (txtPage_clear_checkbox.Checked)
				{
					pLUTableAdapter.DeleteQuery();
				}
				else
				{
					pLUTableAdapter.Fill(ecsOldSet.PLU);
					eCSDataSet.PLU.Merge(ecsOldSet.PLU, preserveChanges: true);
				}
				pLUTableAdapter.Update(eCSDataSet.PLU);
				DataSet_Update("PLU");
			}
			MessageBox.Show(this, Program.GetLang("pw_OperationSuccess"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
			base.DialogResult = DialogResult.OK;
		}
		else
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void exeButton_Click(object sender, EventArgs e)
	{
		Settings.Default.txtfilePath = filenameTextBox.Text;
		Settings.Default.txtfileFormat = typeTextBox.Text;
		Settings.Default.txtfileClear = txtPage_clear_checkbox.Checked;
		Settings.Default.Save();
		if (Program.mf.m_netForm != null)
		{
			Program.mf.m_netForm.TXT_Update();
		}
		if (saveButton.Checked)
		{
			SaveToFile();
		}
		else if (openButton.Checked)
		{
			OpenFromFile();
		}
		Program.mf.DataSet_Update("TXT", "TXTForm");
	}

	private void TXTForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_Import_Export");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		exeButton.Text = Program.GetLang("pw_Execute");
		formtype.Text = Program.GetLang("pw_FileFormat");
		openButton.Text = Program.GetLang("pw_Import_ToSoftware_");
		saveButton.Text = Program.GetLang("pw_Export_ToFile_");
		txtfile.Text = Program.GetLang("pw_FileName");
		txtPage_clear_checkbox.Text = Program.GetLang("pw_ClearPLUbeforeoperation");
		Custom_Button.Text = Program.GetLang("pw_Edit");
		Font = Settings.Default.CustomFont;
		string fileName = Application.StartupPath + "\\Combo.xml";
		uiDataSet.TXTForm_Type.ReadXml(fileName);
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
		filenameTextBox.Text = Settings.Default.txtfilePath;
		typeTextBox.Text = Settings.Default.txtfileFormat;
		txtPage_clear_checkbox.Checked = Settings.Default.txtfileClear;
	}

	private void Custom_Button_Click(object sender, EventArgs e)
	{
		using TXTEditorForm tXTEditorForm = new TXTEditorForm(typeTextBox.Text, "DWL");
		if (tXTEditorForm.ShowDialog(this) == DialogResult.OK)
		{
			typeTextBox.Text = tXTEditorForm.SG_String;
		}
	}
}
